from src.add_file.add_file_config import ALLOWED_EXTENSIONS
def allowed_file(filename):
    extension = filename.rsplit(".", 1)[1].lower() 
    allowed = "." in filename and extension in ALLOWED_EXTENSIONS.keys()
    
    return allowed , ALLOWED_EXTENSIONS.get(extension)

