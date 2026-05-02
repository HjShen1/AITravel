from django.db import migrations
from pgvector.django import VectorField


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_poi_latitude_poi_longitude'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='poi',
            name='embedding',
        ),
        migrations.AddField(
            model_name='poi',
            name='embedding',
            field=VectorField(dimensions=1536, null=True, blank=True),
        ),
    ]