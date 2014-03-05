from django.db import models
from kicker.models import DiffTracker

class Model1(DiffTracker):

    name = models.CharField(blank=True, null=True, max_length=32)

    class Meta:
        abstract = False

class Model2(DiffTracker):

    name = models.CharField(blank=True, null=True, max_length=32)

    class Meta:
        abstract = False
