import os
import shutil
import datetime

change = 'dues-notification-and-report'
root = r'c:\PROJECT WEB HMTI\openspec\changes\dues-notification-and-report'
archive_dir = r'c:\PROJECT WEB HMTI\openspec\changes\archive'
os.makedirs(archive_dir, exist_ok=True)
target = os.path.join(archive_dir, datetime.datetime.now().strftime('%Y-%m-%d') + '-' + change)
if os.path.exists(target):
    raise SystemExit(f'Archive target already exists: {target}')
shutil.move(root, target)
print(target)
