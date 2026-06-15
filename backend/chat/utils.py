import os
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from moviepy import VideoFileClip
from PIL import Image
import tempfile

def validate_file_size(value):
    filesize = value.size
    
    if filesize > 25 * 1024 * 1024:
        raise ValidationError("The maximum file size that can be uploaded is 25MB")
    else:
        return value

def validate_file_extension(value):
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov']
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported file extension.')
    return value

def generate_video_thumbnail(video_path):
    try:
        clip = VideoFileClip(video_path)
        frame = clip.get_frame(1.0) # get frame at 1 second
        
        image = Image.fromarray(frame)
        
        # Save to temp file
        temp_thumb = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        image.save(temp_thumb.name, 'JPEG')
        
        return temp_thumb.name
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return None
