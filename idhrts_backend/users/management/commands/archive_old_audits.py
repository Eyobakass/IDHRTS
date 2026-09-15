"""
Task 3: Data Retention Management Command
Archives and deletes audit logs older than 7 years
Usage: python manage.py archive_old_audits
"""
import json
import gzip
import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from users.models import AuditLog

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Archive audit logs older than 7 years and delete them from the database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting audit log archival process...'))

        # Calculate the date exactly 7 years ago
        seven_years_ago = timezone.now() - timedelta(days=7*365)
        self.stdout.write(f'Archiving logs older than: {seven_years_ago.strftime("%Y-%m-%d %H:%M:%S")}')

        # Query old audit logs
        old_logs = AuditLog.objects.filter(timestamp__lt=seven_years_ago)
        log_count = old_logs.count()

        if log_count == 0:
            self.stdout.write(self.style.SUCCESS('No audit logs found older than 7 years. Nothing to archive.'))
            return

        self.stdout.write(f'Found {log_count} audit logs to archive.')

        try:
            # Serialize logs to JSON-compatible format
            logs_data = []
            for log in old_logs:
                log_dict = {
                    'id': str(log.id),
                    'actor_id': str(log.actor_id) if log.actor_id else None,
                    'action': log.action,
                    'target_id': str(log.target_id) if log.target_id else None,
                    'target_type': log.target_type,
                    'ip_address': log.ip_address,
                    'user_agent': log.user_agent,
                    'timestamp': log.timestamp.isoformat(),
                    'metadata': log.metadata
                }
                logs_data.append(log_dict)

            # Create archives directory if it doesn't exist
            archives_dir = settings.BASE_DIR / 'archives'
            archives_dir.mkdir(exist_ok=True)

            # Generate filename with timestamp
            archive_timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            archive_filename = f'audit_archive_{archive_timestamp}.json.gz'
            archive_path = archives_dir / archive_filename

            # Write compressed JSON file
            self.stdout.write(f'Writing archive to: {archive_path}')

            with gzip.open(archive_path, 'wt', encoding='utf-8') as f:
                json.dump({
                    'archived_at': timezone.now().isoformat(),
                    'cutoff_date': seven_years_ago.isoformat(),
                    'record_count': log_count,
                    'logs': logs_data
                }, f, indent=2)

            self.stdout.write(self.style.SUCCESS(f'Successfully archived {log_count} logs to {archive_filename}'))

            # Delete old logs from database
            self.stdout.write('Deleting archived logs from database...')
            deleted_count, _ = old_logs.delete()

            self.stdout.write(self.style.SUCCESS(
                f'Successfully deleted {deleted_count} audit logs from the database.'
            ))
            self.stdout.write(self.style.SUCCESS(
                f'Archive file size: {archive_path.stat().st_size / 1024:.2f} KB'
            ))
            self.stdout.write(self.style.SUCCESS('Archival process completed successfully!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during archival process: {str(e)}'))
            logger.exception('Audit log archival failed')
            raise
