import numpy as np
import time
from datetime import datetime
import cv2
import mediapipe as mp
import numpy as np
import time
import math
from datetime import datetime
import os


class PushUpCounter:
    def __init__(self, user_id="default_user"):
        # MediaPipe setup
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.mp_pose = mp.solutions.pose

        self.user_id = user_id
        self.session_id = str(datetime.now().timestamp())

        # Push-up variables
        self.count = 0
        self.position = None
        self.form_feedback = "Start in plank position"
        self.rep_status = ""
        self.start_time = time.time()
        self.last_rep_time = time.time()

        # Performance metrics
        self.rep_times = []
        self.holding_times = []
        self.hold_start = None
        self.form_issues_log = []

        # Form validation thresholds
        self.elbow_angle_threshold = 90  # Degree threshold for elbow bend
        self.back_straight_threshold = 160  # Degree threshold for straight back
        self.rep_speed_threshold = 4  # Seconds

        # Session stats
        self.session_start = datetime.now()
        self.calories_burned = 0
        self.incorrect_forms = 0

        # UI elements
        self.debug_mode = False
        self.show_angles = True
        self.show_skeleton = True

        # Performance metrics
        self.metrics = {
            'total_reps': 0,
            'correct_reps': 0,
            'incorrect_reps': 0,
            'avg_speed': 0,
            'consistency': 0,
            'endurance': 0
        }

    def calculate_angle(self, a, b, c):
        """Calculate angle between three points"""
        a = np.array([a[1], a[2]])  # First point (x,y)
        b = np.array([b[1], b[2]])  # Mid point (x,y)
        c = np.array([c[1], c[2]])  # End point (x,y)

        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)

        if angle > 180.0:
            angle = 360-angle

        return angle

    def calculate_calories(self):
        """More accurate calorie estimation based on reps and time"""
        # Rough estimate: 0.5 cal per push-up plus 3 cal per minute
        duration = (datetime.now() - self.session_start).total_seconds() / 60
        return self.count * 0.5 + duration * 3

    def detect_form_issues(self, landmarks):
        """Enhanced form detection with more checks and improved thresholds"""
        issues = []

        if len(landmarks) < 33:
            return ["Cannot detect full body"]

        # Get relevant landmarks
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_elbow = landmarks[13]
        right_elbow = landmarks[14]
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        nose = landmarks[0]

        # Calculate angles
        right_elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
        left_elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)

        back_angle_right = self.calculate_angle(right_hip, right_shoulder, landmarks[8])
        back_angle_left = self.calculate_angle(left_hip, left_shoulder, landmarks[7])

        # Check for elbow flare (hands should be under shoulders)
        shoulder_width = abs(right_shoulder[1] - left_shoulder[1])
        hand_spread = abs(right_wrist[1] - left_wrist[1])

        # Check for hip sagging
        hip_shoulder_diff = abs((right_hip[2] + left_hip[2])/2 -
                               (right_shoulder[2] + left_shoulder[2])/2)

        # Check for head position
        head_hip_diff = abs(nose[2] - (right_hip[2] + left_hip[2])/2)

        # Print debugging info
        print(f"[Form Check] Elbow angles: L={left_elbow_angle:.1f}, R={right_elbow_angle:.1f}")
        print(f"[Form Check] Back angles: L={back_angle_left:.1f}, R={back_angle_right:.1f}")
        print(f"[Form Check] Hip-shoulder diff: {hip_shoulder_diff:.1f}")
        print(f"[Form Check] Hand spread vs shoulder width: {hand_spread:.1f} vs {shoulder_width:.1f}")

        # Form checks with more lenient thresholds for better detection
        if self.position == "down" and min(right_elbow_angle, left_elbow_angle) > 110:  # More lenient
            issues.append("Not low enough")

        if min(back_angle_right, back_angle_left) < 150:  # More lenient
            issues.append("Back not straight")

        if hip_shoulder_diff > 40:  # More lenient
            issues.append("Hips misaligned")

        if hand_spread > shoulder_width * 1.8:  # More lenient
            issues.append("Hands too wide")

        if head_hip_diff > 60:  # More lenient
            issues.append("Head position incorrect")

        return issues

    def annotate_image(self, image, landmarks):
        """Enhanced annotation with more metrics"""
        h, w, _ = image.shape

        # Add rep counter
        cv2.putText(image, f"Reps: {self.count}", (30, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Add form feedback
        cv2.putText(image, f"{self.form_feedback}", (30, 80),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        if self.rep_status:
            cv2.putText(image, f"{self.rep_status}", (30, 120),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 165, 255), 2)

        # Add timer
        elapsed = int(time.time() - self.start_time)
        mins, secs = divmod(elapsed, 60)
        cv2.putText(image, f"Time: {mins:02d}:{secs:02d}", (w-200, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # Add calories
        self.calories_burned = self.calculate_calories()
        cv2.putText(image, f"Calories: {self.calories_burned:.1f}", (w-200, 80),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # Add incorrect form counter
        cv2.putText(image, f"Bad Form: {self.incorrect_forms}", (w-200, 120),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        # Add angle visualization if enabled
        if self.show_angles and len(landmarks) >= 33:
            # Draw elbow angles
            self.draw_angle(image, landmarks[11], landmarks[13], landmarks[15], "L Elbow")
            self.draw_angle(image, landmarks[12], landmarks[14], landmarks[16], "R Elbow")

            # Draw back angle
            self.draw_angle(image, landmarks[23], landmarks[11], landmarks[7], "Back")

        return image

    def draw_angle(self, image, a, b, c, label=None):
        """Draw angle between three landmarks"""
        # Convert landmark indices to pixel coordinates
        h, w, _ = image.shape
        ax, ay = int(a[1]), int(a[2])
        bx, by = int(b[1]), int(b[2])
        cx, cy = int(c[1]), int(c[2])

        # Calculate angle
        angle = self.calculate_angle(a, b, c)

        # Draw lines
        cv2.line(image, (bx, by), (ax, ay), (255, 255, 0), 2)
        cv2.line(image, (bx, by), (cx, cy), (255, 255, 0), 2)

        # Draw angle text
        angle_text = f"{int(angle)}°"
        text_pos = (bx + 10, by + 10)
        cv2.putText(image, angle_text, text_pos,
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

        if label:
            label_pos = (bx - 30, by - 10)
            cv2.putText(image, label, label_pos,
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

        return image

    def calculate_metrics(self):
        """Calculate performance metrics"""
        if self.rep_times:
            self.metrics['avg_speed'] = np.mean(self.rep_times)
            self.metrics['consistency'] = 1 - (np.std(self.rep_times) / np.mean(self.rep_times))

        self.metrics['total_reps'] = self.count + self.incorrect_forms
        self.metrics['correct_reps'] = self.count
        self.metrics['incorrect_reps'] = self.incorrect_forms
        self.metrics['endurance'] = min(1, len(self.rep_times) / 30)  # Normalized to 30 reps

        return self.metrics

    def process_frame(self, frame, pose):
        """Process a single frame for push-up detection"""
        # Convert the BGR image to RGB
        image = cv2.cvtColor(cv2.flip(frame, 1), cv2.COLOR_BGR2RGB)
        image.flags.writeable = False

        # Process the image
        result = pose.process(image)

        # Convert back to BGR for OpenCV
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # If pose landmarks were detected
        if result.pose_landmarks:
            # Draw the pose landmarks if enabled
            if self.show_skeleton:
                self.mp_drawing.draw_landmarks(
                    image,
                    result.pose_landmarks,
                    self.mp_pose.POSE_CONNECTIONS,
                    landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style())

            # Extract landmarks
            landmarks = []
            for id, lm in enumerate(result.pose_landmarks.landmark):
                h, w, _ = image.shape
                x, y = int(lm.x * w), int(lm.y * h)
                landmarks.append([id, x, y])

            if len(landmarks) != 0:
                # Detect push-up position using shoulder and elbow height
                prev_position = self.position

                # Get relevant landmarks
                left_shoulder = landmarks[11]
                right_shoulder = landmarks[12]
                left_elbow = landmarks[13]
                right_elbow = landmarks[14]
                left_wrist = landmarks[15]
                right_wrist = landmarks[16]

                # Calculate elbow angles
                right_elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
                left_elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)

                # Average elbow angle
                avg_elbow_angle = (right_elbow_angle + left_elbow_angle) / 2

                # Improved position detection based on elbow angle
                if avg_elbow_angle < 100:  # Arms bent significantly
                    current_position = 'down'
                elif avg_elbow_angle > 150:  # Arms mostly straight
                    current_position = 'up'
                else:
                    # Maintain previous position if in transition zone
                    current_position = self.position if self.position else 'unknown'

                print(f"[PushUpCounter] Elbow angles - Left: {left_elbow_angle:.1f}, Right: {right_elbow_angle:.1f}, Avg: {avg_elbow_angle:.1f}, Position: {current_position}")

                # Check for form issues
                form_issues = self.detect_form_issues(landmarks)
                if form_issues:
                    self.form_feedback = " & ".join(form_issues)
                    self.form_issues_log.append({
                        "timestamp": time.time(),
                        "issues": form_issues,
                        "position": current_position
                    })
                else:
                    self.form_feedback = "Good form!"

                # Handle position change with improved logic
                if self.position != current_position:
                    print(f"[PushUpCounter] Position changed from {self.position} to {current_position}")

                    # Count rep when moving from down to up
                    if prev_position == 'down' and current_position == 'up':
                        now = time.time()
                        rep_time = now - self.last_rep_time
                        self.last_rep_time = now

                        # More lenient form checking for counting reps
                        if not form_issues or len(form_issues) <= 1:  # Allow one minor form issue
                            self.count += 1
                            self.rep_times.append(rep_time)
                            self.rep_status = f"Rep #{self.count} in {rep_time:.1f}s"
                            print(f"[PushUpCounter] Rep #{self.count} counted! Time: {rep_time:.1f}s")
                        else:
                            self.incorrect_forms += 1
                            self.rep_status = f"Incorrect form - not counted: {', '.join(form_issues)}"
                            print(f"[PushUpCounter] Incorrect form - not counted: {form_issues}")

                    # Start hold timer when at bottom position
                    if current_position == 'down' and self.hold_start is None:
                        self.hold_start = time.time()
                        self.rep_status = "Hold position..."
                        print("[PushUpCounter] Started hold timer")

                    # Update position after processing
                    self.position = current_position

                # Check holding time at bottom position
                if self.position == 'down' and self.hold_start is not None:
                    hold_time = time.time() - self.hold_start
                    if hold_time >= 1.0:  # Hold threshold
                        self.rep_status = f"Holding: {hold_time:.1f}s"

                # Reset hold timer when moving up
                if self.position == 'up' and self.hold_start is not None:
                    hold_time = time.time() - self.hold_start
                    self.holding_times.append(hold_time)
                    self.hold_start = None

            # Add UI elements
            image = self.annotate_image(image, landmarks)

        return image

    def get_session_stats(self):
        """Get statistics for the current workout session"""
        session_duration = (datetime.now() - self.session_start).total_seconds()
        mins, secs = divmod(int(session_duration), 60)

        avg_rep_time = np.mean(self.rep_times) if self.rep_times else 0
        avg_hold_time = np.mean(self.holding_times) if self.holding_times else 0

        stats = {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "reps_completed": self.count,
            "incorrect_forms": self.incorrect_forms,
            "session_time": f"{mins}:{secs:02d}",
            "avg_rep_time": f"{avg_rep_time:.2f}s",
            "avg_hold_time": f"{avg_hold_time:.2f}s",
            "calories_burned": f"{self.calculate_calories():.1f}",
            "metrics": self.calculate_metrics()
        }

        return stats

def test_pushup_counter_live(user_id="default_user", session_id=None):
    """Test function that uses live camera feed to demonstrate all PushUpCounter functions"""
    print(f"Starting PushUpCounter live test for user: {user_id}, session: {session_id}")

    import json

    # Create an instance of PushUpCounter
    counter = PushUpCounter(user_id)
    if session_id:
        counter.session_id = session_id
    print(f"Created counter for user: {counter.user_id} with session: {counter.session_id}")

    # Path for JSON status file
    stats_dir = os.path.dirname(os.path.abspath(__file__))
    stats_file_path = os.path.join(stats_dir, f"session_stats_{counter.session_id}.json")

    # Helper to write stats
    def write_stats(status='running'):
        try:
            current_stats = counter.get_session_stats()
            total = current_stats['metrics']['total_reps']
            correct = current_stats['reps_completed']
            accuracy = int((correct / total) * 100) if total > 0 else 100
            
            output_data = {
                'reps_completed': current_stats['reps_completed'],
                'incorrect_forms': current_stats['incorrect_forms'],
                'calories_burned': float(current_stats['calories_burned']),
                'form_accuracy': accuracy,
                'elapsed_time': int(time.time() - counter.start_time),
                'status': status
            }
            temp_path = stats_file_path + ".tmp"
            with open(temp_path, "w") as f:
                json.dump(output_data, f)
            os.replace(temp_path, stats_file_path)
        except Exception as e:
            print(f"Error writing stats: {e}")

    # Initialize the webcam
    cap = cv2.VideoCapture(0)  # 0 is usually the default webcam
    if not cap.isOpened():
        print("Failed to open webcam.")
        try:
            with open(stats_file_path, "w") as f:
                json.dump({
                    'status': 'error',
                    'message': 'Failed to open webcam. Please check your camera connection.'
                }, f)
        except Exception as e:
            print(f"Error writing error stats: {e}")
        return False

    # Set camera resolution for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Initialize MediaPipe Pose
    mp_pose = mp.solutions.pose

    # Print instructions
    print("\nControls:")
    print("  Press 'q' to quit")
    print("  Press 'r' to reset counter")
    print("  Press 'd' to toggle debug mode")
    print("  Press 'a' to toggle angle display")
    print("  Press 's' to toggle skeleton display")

    last_write_time = 0

    with mp_pose.Pose(
        min_detection_confidence=0.8,
        min_tracking_confidence=0.8) as pose:

        start_time = time.time()

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                print("Failed to read from webcam.")
                break

            # Process frame - this calls multiple functions internally
            output_image = counter.process_frame(frame, pose)

            # Write stats periodically
            now = time.time()
            if now - last_write_time > 0.5:
                write_stats('running')
                last_write_time = now

            # Display runtime info
            elapsed = int(time.time() - start_time)
            if elapsed % 5 == 0:  # Every 5 seconds
                # Test calculate_calories
                calories = counter.calculate_calories()

                # Test calculate_metrics
                metrics = counter.calculate_metrics()

                # Print some live stats
                print(f"\rReps: {counter.count}, Position: {counter.position}, Calories: {calories:.1f}", end="")

            # Display the output image
            cv2.imshow('PushUpCounter Live Test', output_image)

            # Wait for key press
            key = cv2.waitKey(1)
            if key == ord('q'):
                break
            elif key == ord('r'):
                counter.count = 0
                counter.rep_times = []
                counter.start_time = time.time()
                counter.form_issues_log = []
                print("\nCounter reset")
                write_stats('running')
            elif key == ord('d'):
                counter.debug_mode = not counter.debug_mode
                print(f"\nDebug mode: {counter.debug_mode}")
            elif key == ord('a'):
                counter.show_angles = not counter.show_angles
                print(f"\nShow angles: {counter.show_angles}")
            elif key == ord('s'):
                counter.show_skeleton = not counter.show_skeleton
                print(f"\nShow skeleton: {counter.show_skeleton}")

    # Clean up
    cap.release()
    cv2.destroyAllWindows()

    # Write final stats
    write_stats('terminated')

    # Get final session stats
    print("\n\nFinal Session Statistics:")
    stats = counter.get_session_stats()
    for key, value in stats.items():
        if key == "metrics":
            print(f"\nPerformance Metrics:")
            for metric_key, metric_value in value.items():
                print(f"  {metric_key}: {metric_value}")
        else:
            print(f"{key}: {value}")

    print("\nAll PushUpCounter functions have been tested with live camera feed!")
    
    # Try to clean up the status file after a delay or just leave it for the API to read final stats
    return True

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run push-up counter live demo.")
    parser.add_argument("--user_id", type=str, default="default_user", help="User ID")
    parser.add_argument("--session_id", type=str, default=None, help="Session ID")
    args = parser.parse_args()

    # Run the test function with live camera
    test_pushup_counter_live(user_id=args.user_id, session_id=args.session_id)