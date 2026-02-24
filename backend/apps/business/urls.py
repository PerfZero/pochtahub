from django.urls import path

from .views import BusinessEventCreateView, BusinessTrialStatusView

urlpatterns = [
    path("events/", BusinessEventCreateView.as_view(), name="business-events"),
    path("trial-status/", BusinessTrialStatusView.as_view(), name="business-trial-status"),
]

