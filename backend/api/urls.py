from django.urls import path
from .views import embed_pois, generate_itinerary, import_places, stream_itinerary, test

urlpatterns = [
    path('test/', test),
    path('generate/', generate_itinerary),
    path('embed-pois/', embed_pois),
    path('stream/', stream_itinerary),
    path('import-places/', import_places),
]