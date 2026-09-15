from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('disputes', '0002_alter_dispute_status'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DisputeDocument',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('doc_type', models.CharField(
                    choices=[
                        ('EVIDENCE', 'Evidence'),
                        ('RULING', 'Ruling Document'),
                        ('APPEAL', 'Appeal Document'),
                    ],
                    default='EVIDENCE',
                    max_length=20,
                )),
                ('file_path', models.CharField(max_length=500)),
                ('original_filename', models.CharField(default='', max_length=255)),
                ('file_size_bytes', models.IntegerField()),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('dispute', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='documents',
                    to='disputes.dispute',
                )),
                ('uploaded_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='dispute_documents',
                    to='users.user',
                )),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
