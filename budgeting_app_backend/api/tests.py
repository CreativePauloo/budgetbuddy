from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
import json

class APITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_categorize_transaction(self):
        url = reverse('categorize')
        data = {'description': 'Grocery shopping'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('category', response.json())