from django.contrib import admin

from .models import BusinessEvent


@admin.register(BusinessEvent)
class BusinessEventAdmin(admin.ModelAdmin):
    list_display = ("id", "event_type", "user", "source", "count_photos", "created_at")
    list_filter = ("event_type", "source", "created_at")
    search_fields = ("user__username", "user__phone", "user__email")
    readonly_fields = ("created_at",)

