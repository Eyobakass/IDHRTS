# Generated manually for SRS completion changes
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tax', '0004_taxassessment_prn_code'),
        ('contracts', '0003_alter_rentalcontract_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='taxassessment',
            name='is_under_investigation',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='taxassessment',
            name='override_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='taxassessment',
            name='contract',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='assessments',
                to='contracts.rentalcontract',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='taxassessment',
            unique_together={('property', 'fiscal_year')},
        ),
    ]
