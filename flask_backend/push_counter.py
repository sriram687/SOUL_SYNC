import cv2
import mediapipe as mp


mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose


count  = 0
position = None
cap = cv2.VideoCapture(0)

with mp_pose.Pose(
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7) as pose:
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("Ignoring empty camera frame.")
            break

        image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)
        result = pose.process(image)
        imlist = []

        if result.pose_landmarks:
            mp_drawing.draw_landmarks(
                image, result.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            for id, im in enumerate(result.pose_landmarks.landmark):
                h, w, _ = image.shape
                X, Y = int(im.x * w), int(im.y * h)
                imlist.append([id, X, Y])
        
        if len(imlist) != 0:
            if (imlist[12][2] and imlist[11][2] >= imlist[14][2] and imlist[14][2] and imlist[13][2]):
                    position = 'down'
            if (imlist[12][2] and imlist[11][2] <= imlist[14][2] and imlist[13][2] and position == 'down'):
                position = 'up'
                count += 1
                print(count)
            
            cv2.imshow('Push-Up Counter', cv2.flip(image, 1))
            key = cv2.waitKey(1)
            if key==ord('q'):
                break

cap.release()
cv2.destroyAllWindows()