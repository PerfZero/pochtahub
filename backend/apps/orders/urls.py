from django.urls import path
from .views import OrderListView, OrderDetailView, get_order_documents, update_order_status_from_cdek, get_order_tracking, upload_package_image, get_app_settings

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/documents/', get_order_documents, name='order-documents'),
    path('<int:pk>/update-status/', update_order_status_from_cdek, name='order-update-status'),
    path('<int:pk>/tracking/', get_order_tracking, name='order-tracking'),
    path('upload-image/', upload_package_image, name='upload-package-image'),
    path('settings/', get_app_settings, name='app-settings'),
]
