import json
import boto3
import cv2
import numpy as np
import urllib.parse
import urllib.request
import time

s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb')
yolo_bucket = 'imageyolo'
confthres = 0.3
nmsthres = 0.1


def get_labels(bucket_name):
    # load the COCO class labels our YOLO model was trained on
    LABELS = s3.get_object(Bucket=bucket_name, Key="coco.names")["Body"].read().decode("utf-8").strip().split("\n")
    return LABELS

def get_weights(bucket_name):
    # derive the paths to the YOLO weights and model configuration
    weights = s3.get_object(Bucket=bucket_name, Key="yolov3.weights")["Body"].read()
    return weights

def get_config(bucket_name):
    config = s3.get_object(Bucket=bucket_name, Key="yolov3.cfg")["Body"].read()
    return config

def load_model(config,weights):
    # load our YOLO object detector trained on COCO dataset (80 classes)
    print("[INFO] loading YOLO from disk...")
    net = cv2.dnn.readNetFromDarknet(config, weights)
    return net

def do_prediction(image,net,LABELS):

    (H, W) = image.shape[:2]
    # determine only the *output* layer names that we need from YOLO
    ln = net.getLayerNames()
    ln = [ln[i[0] - 1] for i in net.getUnconnectedOutLayers()]

    # construct a blob from the input image and then perform a forward
    # pass of the YOLO object detector, giving us our bounding boxes and
    # associated probabilities
    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416),
                                 swapRB=True, crop=False)
    net.setInput(blob)
    start = time.time()
    layerOutputs = net.forward(ln)
    # print(layerOutputs)
    end = time.time()
    #
    # # show timing information on YOLO
    # print("[INFO] YOLO took {:.6f} seconds".format(end - start))

    # initialize our lists of detected bounding boxes, confidences, and
    # class IDs, respectively
    boxes = []
    confidences = []
    classIDs = []
    objects = []
    tags = []

    # loop over each of the layer outputs
    for output in layerOutputs:
        # loop over each of the detections
        for detection in output:
            # extract the class ID and confidence (i.e., probability) of
            # the current object detection
            scores = detection[5:]
            # print(scores)
            classID = np.argmax(scores)
            # print(classID)
            confidence = scores[classID]

            # filter out weak predictions by ensuring the detected
            # probability is greater than the minimum probability
            if confidence > confthres:
                # scale the bounding box coordinates back relative to the
                # size of the image, keeping in mind that YOLO actually
                # returns the center (x, y)-coordinates of the bounding
                # box followed by the boxes' width and height
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")

                # use the center (x, y)-coordinates to derive the top and
                # and left corner of the bounding box
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))

                # update our list of bounding box coordinates, confidences,
                # and class IDs
                boxes.append([x, y, int(width), int(height)])

                confidences.append(float(confidence))
                classIDs.append(classID)

    # apply non-maxima suppression to suppress weak, overlapping bounding boxes
    idxs = cv2.dnn.NMSBoxes(boxes, confidences, confthres,
                            nmsthres)

    # TODO Prepare the output as required to the assignment specification
    # ensure at least one detection exists
    if len(idxs) > 0:
        # loop over the indexes we are keeping
        for i in idxs.flatten():
            print("detected item:{}".format(LABELS[classIDs[i]]))

            each_object = LABELS[classIDs[i]]
            objects.append(each_object)
    objects = list(set(objects))
    for each_object in objects:
        tags.append({"S": each_object})

    return tags

def lambda_handler(event, context):
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    # etag = event['Records'][0]['s3']['object']['eTag']
    # etag = '"{}"'.format(etag)
    bucket = event['Records'][0]['s3']['bucket']['name']
    user_identity = event['Records'][0]['userIdentity']['principalId']
    table = "image_db"

    url = s3.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': bucket,
            'Key': key
        }
    )

    # load yolo3
    Lables = get_labels(yolo_bucket)
    CFG = get_config(yolo_bucket)
    Weights = get_weights(yolo_bucket)
    # load the neural net.  Should be local to this method as its multi-threaded endpoint
    nets = load_model(CFG, Weights)

    # read image
    # nparray = cv2.imread(image_tmp_path)
    req = urllib.request.urlopen(url)
    image = np.asarray(bytearray(req.read()),dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    tags = do_prediction(image, nets, Lables)

    url_clean = urllib.parse.urlunsplit(urllib.parse.urlsplit(url)._replace(query="", fragment=""))

    response = dynamodb.put_item(
        TableName=table,
        Item={
            "url": {"S": url_clean},
            "tags": {"L": tags},
            "user": {"S": user_identity}
        }
        )
    return response