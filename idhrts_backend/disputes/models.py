import uuid
from django.db import models
from users.models import User, Woreda
from contracts.models import RentalContract

class Dispute(models.Model):
    STATUS_CHOICES = (
        ('FILED', 'Filed'), ('UNDER_REVIEW', 'Under Review'), 
        ('DECISION_ISSUED', 'Decision Issued'), ('APPEALED', 'Appealed'), ('CLOSED', 'Closed')
    )
    TYPE_CHOICES = (
        ('UNLAWFUL_RENT_INCREASE', 'Unlawful Rent Increase'), 
        ('ILLEGAL_EVICTION_NOTICE', 'Illegal Eviction Notice'),
        ('UNREGISTERED_CONTRACT', 'Unregistered Contract'), 
        ('UTILITY_DISCONNECTION', 'Utility Disconnection'),
        ('DEPOSIT_NOT_RETURNED', 'Deposit Not Returned'), 
        ('OTHER', 'Other')
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    filer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_disputes')
    respondent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_disputes', null=True)
    contract = models.ForeignKey(RentalContract, on_delete=models.SET_NULL, null=True, blank=True)
    woreda = models.ForeignKey(Woreda, on_delete=models.CASCADE)
    assigned_officer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='handled_disputes')
    description = models.TextField()
    incident_date = models.DateField(null=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='FILED', db_index=True)
    ruling_text = models.TextField(null=True, blank=True)
    ruling_at = models.DateTimeField(null=True, blank=True)
    appeal_deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class DisputeDocument(models.Model):
    """FR-DISP-004: Evidence documents uploaded by parties to a dispute."""
    DOC_TYPE_CHOICES = (
        ('EVIDENCE', 'Evidence'),
        ('RULING', 'Ruling Document'),
        ('APPEAL', 'Appeal Document'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='dispute_documents')
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES, default='EVIDENCE')
    file_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255, default='')
    file_size_bytes = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

