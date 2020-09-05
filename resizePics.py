from PIL import Image
import json
import os

path = 'C:\\Users\\tinta\\OneDrive\\Documents\\Projects\\Datos_Mercatenerife\\Photos\\'
save_path = 'C:\\Users\\tinta\\OneDrive\\Documents\\Projects\\Datos_Mercatenerife\\Resized_Photos\\'
resize_ratio = 0.05  # where 0.5 is half size, 2 is double size


def resize_aspect_fit():
    dirs = os.listdir(path)
    # product_pics = {}
    for item in dirs:
        if item == '.jpg':
            continue
        if os.path.isfile(path+item):
            image = Image.open(path+item)
            file_path, extension = os.path.splitext(save_path+item)

            new_image_height = int(image.size[0] / (1/resize_ratio))
            new_image_length = int(image.size[1] / (1/resize_ratio))

            image = image.resize((new_image_height, new_image_length), Image.ANTIALIAS)
            image.save(file_path + extension, 'JPEG', quality=90)


def createDictOfProductPhotos():
    # Create dict of products with available picture
    dirs = os.listdir(save_path)
    product_pics = {}
    for item in dirs:
        file_name, _ = os.path.splitext(item)
        split_name = file_name.split('-')

        if os.path.isfile(save_path+item):
            file_path, extension = os.path.splitext(save_path+item)

            if len(split_name) > 1:
                for name in split_name:
                    product_pics[name] = file_name + extension
            else:
                product_pics[split_name[0]] = file_name + extension
            with open('product_pics.json', 'w') as json_file:
                json_file.writelines("product_pics = ")
                json.dump(product_pics, json_file)
                json_file.close()


resize_aspect_fit()
createDictOfProductPhotos()
