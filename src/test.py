import requests
import base64
import json
from PIL import Image
import io
import cv2
import numpy as np

def test(tag):
      url = "https://yj6qpal7a0.execute-api.us-east-1.amazonaws.com/alpha/api-1"

      data={}
      # data['url'] = "https://5225-image-upload-bucket.s3.amazonaws.com/000000031703.jpg"
      data['tags'] = tag

      #image_file = open("000000012807.jpg", "rb")
      #data['image'] = base64.b64encode(image_file.read()).decode('utf-8')

      #print(data["image"])
      # img_binary = data["image"]
      # img_string = base64.b64decode(img_binary)
      # img = Image.open(io.BytesIO(img_string))
      #
      # npimg = np.asarray(img)
      # image = npimg.copy()
      # #image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
      # input_params = {"image": image}

      headers = {'Content-Type': 'application/json'}

      response = requests.post(url, json=data, headers=headers)

      print(response.text)
      return response.text
test('person')