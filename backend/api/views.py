import requests
from django.conf import settings
from django.db import connection
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from openai import OpenAI

from .models import POI

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# In-memory cache for embeddings to avoid redundant API calls
cache = {}


# --- API Views ---

@api_view(['GET'])
def test(request):
    return Response({"message": "hello"})


@api_view(['POST'])
def generate_itinerary(request):
    query = request.data.get("query")
    city = request.data.get("city")

    # 1. Embed the user query (use cache if available)
    if query in cache:
        query_embedding = cache[query]
    else:
        query_embedding = client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        ).data[0].embedding
        cache[query] = query_embedding

    # 2. Fetch top 3 POIs by vector similarity using pgvector
    with connection.cursor() as cursor:
        if city:
            cursor.execute(
                """
                SELECT id, name, description
                FROM api_poi
                WHERE city ILIKE %s AND embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT 3;
                """,
                [city, str(query_embedding)]
            )
        else:
            cursor.execute(
                """
                SELECT id, name, description
                FROM api_poi
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT 3;
                """,
                [str(query_embedding)]
            )
        rows = cursor.fetchall()

    poi_text = "\n".join([f"- {r[1]}: {r[2]}" for r in rows])

    # 5. Send prompt to GPT and return full response
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"Plan a 2-day trip.\n\nUse these places:\n{poi_text}"
        }]
    )

    return Response({
        "itinerary": completion.choices[0].message.content,
        "used_pois": poi_text
    })


@api_view(['POST'])
def embed_pois(request):
    """Generate and store embeddings for all POIs that don't have one yet."""
    pois = POI.objects.filter(embedding__isnull=True)
    count = pois.count()

    for poi in pois:
        text = f"{poi.name}. {poi.description}"
        embedding_response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        poi.embedding = embedding_response.data[0].embedding
        poi.save()

    return Response({"message": f"Embedded {count} POIs"})


def stream_itinerary(request):
    """SSE endpoint: streams GPT-generated itinerary token by token."""
    query = request.GET.get("query", "")
    city = request.GET.get("city", "")
    days = int(request.GET.get("days", 2))

    # 1. Embed the user query
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding

    # 2. Fetch and rank POIs by similarity
    # 如果这个城市几乎没有数据，就自动去拉
    existing_count = POI.objects.filter(city__iexact=city).count()
    if city and existing_count < 5:
        fetch_google_places(city)

    with connection.cursor() as cursor:
        if city:
            cursor.execute(
                """
                SELECT id, name, description
                FROM api_poi
                WHERE city ILIKE %s AND embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT 3;
                """,
                [city, str(query_embedding)]
            )
        else:
            cursor.execute(
                """
                SELECT id, name, description
                FROM api_poi
                WHERE embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT 3;
                """,
                [str(query_embedding)]
            )
        rows = cursor.fetchall()

    poi_text = "\n".join([f"- {r[1]}: {r[2]}" for r in rows])

    # 3. Stream GPT response via SSE
    def event_stream():
        try:
            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{
                    "role": "user",
                    "content": (
                        f"Plan a {days}-day trip for: {query}\n"
                        f"Use these places:\n{poi_text}\n\n"
                        "All text must be in English only.\n"
                        "Return STRICT JSON ONLY in this format:\n"
                        '{\n'
                        '  "days": [\n'
                        '    {\n'
                        '      "day": 1,\n'
                        '      "activities": [\n'
                        '        {\n'
                        '          "time": "morning",\n'
                        '          "title": "",\n'
                        '          "description": "",\n'
                        '          "location": ""\n'
                        '        }\n'
                        '      ]\n'
                        '    }\n'
                        '  ]\n'
                        '}\n'
                        "Do not include any text outside JSON."
                    )
                }],
                stream=True
            )

            for chunk in stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield f"data: {content}\n\n"

        except Exception:
            yield "data: [ERROR]\n\n"

        yield "data: [DONE]\n\n"

    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")


def fetch_google_places(city, query="tourist attractions"):
    text_query = f"{query} in {city}"

    url = "https://places.googleapis.com/v1/places:searchText"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.types,places.rating"
    }

    body = {
        "textQuery": text_query
    }

    res = requests.post(url, json=body, headers=headers)
    data = res.json()

    imported = 0

    for place in data.get("places", []):
        name = place.get("displayName", {}).get("text", "")
        address = place.get("formattedAddress", "")
        lat = place.get("location", {}).get("latitude")
        lng = place.get("location", {}).get("longitude")
        types = place.get("types", [])
        rating = place.get("rating", "")
        description = f"{name}. Types: {', '.join(types)}. Rating: {rating}"

        if not name:
            continue

        poi, created = POI.objects.get_or_create(
            name=name,
            city=city,
            defaults={
                "description": description,
                "latitude": lat,
                "longitude": lng,
            }
        )

        if created:
            text = f"{poi.name}. {poi.description}"

            embedding = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            ).data[0].embedding

            poi.embedding = embedding
            poi.save()

        imported += 1

    return imported



@api_view(['POST'])
def import_places(request):
    city = request.data.get("city", "")
    query = request.data.get("query", "tourist attractions")

    imported = fetch_google_places(city, query)

    return Response({"imported": imported})