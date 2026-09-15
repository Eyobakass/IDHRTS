from django.test import TestCase

class WoredaViewsTests(TestCase):
    def test_import_views(self):
        import woreda.views
        self.assertIsNotNone(woreda.views)
