-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: appdb
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `date` varchar(32) NOT NULL,
  `priority` varchar(32) NOT NULL,
  `posted_by` varchar(128) NOT NULL,
  `expires` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES ('ann-001','CSE 4113 Class Rescheduled — Sunday 7 Sep','The CSE 4113 (Pattern Recognition) class scheduled for Sunday, 7th September at 1:00 PM in Room 7A07 has been moved to Room 7A04 at 3:30 PM on the same day. Students must attend the rescheduled slot. — Prof. Dr. Md. Shahriar Mahbub','2026-09-04','high','Prof. Dr. Md. Shahriar Mahbub','2026-09-07'),('ann-002','CSE 4137 Midterm Syllabus','Soft Computing midterm will cover: Fuzzy Sets and Logic (Chapters 1-3), Neural Networks basics (Chapter 4), and Genetic Algorithms introduction (Chapter 5). Exam date will be announced by the department. Refer to the course slides shared on Google Classroom. — Prof. Dr. Faisal Muhammad Shah','2026-09-03','high','Prof. Dr. Faisal Muhammad Shah','2026-09-20'),('ann-003','IPE 4111 Instructor Update','The instructor for IPE 4111 (Industrial Management) has been finalized. Classes will now be conducted by Mr. Md. Arif Hossain starting from next week. The class schedule and room remain unchanged. — CSE Department','2026-09-02','medium','CSE Department','2026-09-10'),('ann-004','Library Closed — September 5 (Friday)','The AUST Central Library will remain closed on Friday, 5th September 2026 due to maintenance work. All reading rooms, digital resource stations, and the lending counter will be unavailable. Normal operations resume on Saturday. — Library Authority','2026-09-03','low','Library Authority','2026-09-05'),('ann-005','CSE 4130 Lab Assignment Submission Deadline Extended','The deadline for CSE 4130 (Formal Languages and Compilers Lab) Assignment 2 has been extended to 10th September 2026 (Wednesday). Submit your report in PDF format on Google Classroom before 11:59 PM. No further extensions will be granted. — Ms. Nusrat Jahan / Ms. Tasnuva Binte Rahman','2026-09-01','high','Ms. Nusrat Jahan','2026-09-10'),('ann-006','AUSTPIC Membership Drive — Fall 2026','AUST Programming and Informatics Club (AUSTPIC) is now accepting new members for the Fall 2026 semester. All CSE students are eligible. Fill out the Google Form (link in bio) before 8th September. Selected members will be notified via email. — AUSTPIC','2026-09-01','medium','AUSTPIC','2026-09-08'),('ann-007','Canteen Price Update — Effective Immediately','Due to recent supply cost increases, canteen prices have been revised. Full lunch meal is now BDT 80 (previously BDT 65). Snacks and beverages remain unchanged. We apologize for the inconvenience. — AUST Canteen Management','2026-08-30','low','AUST Administration','2026-12-31'),('ann-008','Emergency: Water Supply Disruption — Building 7','Due to an emergency pipe repair, water supply to the 7th floor (Building 7) will be disrupted on Saturday, 6th September from 8:00 AM to 1:00 PM. Students are advised to carry water. Labs and classrooms on this floor will remain operational. — Maintenance Department','2026-09-04','high','Maintenance Department','2026-09-06');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `id` varchar(64) NOT NULL,
  `course` varchar(64) NOT NULL,
  `course_title` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `assigned_date` varchar(32) NOT NULL,
  `deadline` varchar(32) NOT NULL,
  `submission_platform` varchar(128) NOT NULL,
  `status` varchar(64) NOT NULL,
  `marks` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES ('asgn-001','CSE 4113','Pattern Recognition and Machine Learning','Assignment 1: Bayes Classifier Implementation','Implement a Naive Bayes classifier from scratch in Python. Use the provided Iris dataset. Submit your .ipynb file and a 1-page PDF report. No sklearn for the classifier itself.','2026-08-28','2026-09-09','Google Classroom','pending',10),('asgn-002','CSE 4130','Formal Languages and Compilers Lab','Assignment 2: Lexical Analyzer using Flex','Write a lexical analyzer for a subset of C language using Flex (Fast Lexical Analyzer). Your analyzer must correctly tokenize keywords, identifiers, operators, and literals. Submit your .l file and a test run screenshot.','2026-08-25','2026-09-10','Google Classroom','pending',15),('asgn-003','CSE 4137','Soft Computing','Term Paper: Fuzzy Logic Application in Real Life','Write a 2000-word term paper on a real-world application of fuzzy logic (e.g., washing machines, traffic control, medical diagnosis). Include diagrams, membership functions, and a brief comparison with crisp logic.','2026-08-20','2026-09-15','Physical submission to FMS sir','pending',20),('asgn-004','CSE 4142','Data Warehousing and Mining Lab','Lab Report 1: Data Preprocessing with WEKA','Perform data preprocessing on the provided sales dataset using WEKA. Apply normalization, handle missing values, and discretize attributes. Submit a lab report with screenshots of each step.','2026-08-27','2026-09-07','Physical submission','submitted',10),('asgn-005','CSE 4173','Cyber Security','Assignment 1: CIA Triad Analysis of a Real Breach','Choose a well-documented cybersecurity breach (e.g., Sony Pictures, Equifax). Analyze it using the CIA Triad framework. Discuss which pillars were violated, how, and what preventive measures could have been taken. 1500 words max.','2026-08-29','2026-09-11','Google Classroom','pending',10),('asgn-006','CSE 4129','Formal Languages and Compilers','Problem Set 1: DFA and NFA Construction','Solve 5 problems on constructing DFAs and NFAs for given languages. Also convert the given NFA to DFA using the subset construction method. Show all states and transitions clearly.','2026-08-26','2026-09-04','Physical submission in class','submitted',10),('asgn-007','CSE 4141','Data Warehousing and Mining','Assignment 1: Data Warehouse Schema Design','Design a star schema and snowflake schema for a fictional e-commerce company. Identify fact tables, dimension tables, and define all attributes. Submit as a PDF with ER diagrams.','2026-09-01','2026-09-14','Google Classroom','pending',15),('asgn-008','CSE 4114','Pattern Recognition and Machine Learning Lab','Lab Assignment 1: Feature Extraction and Visualization','Using the MNIST dataset, extract features using PCA and t-SNE. Plot the results and compare. Submit your .ipynb and a brief PDF analysis. Use Python with sklearn and matplotlib.','2026-09-03','2026-09-17','Google Classroom','pending',10);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `booking_id` varchar(64) NOT NULL,
  `room_number` varchar(64) NOT NULL,
  `booked_by` varchar(128) NOT NULL,
  `date` varchar(32) NOT NULL,
  `start_time` varchar(16) NOT NULL,
  `end_time` varchar(16) NOT NULL,
  `purpose` text NOT NULL,
  PRIMARY KEY (`booking_id`),
  KEY `room_number` (`room_number`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`room_number`) REFERENCES `rooms` (`room_number`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES ('bk-001','7A06','Nusrat Jahan','2026-09-07','13:00','14:40','CSE 4129 Extra Class'),('bk-002','7B04','Raihan Tanvir','2026-09-05','14:00','16:00','CSE 4138 Lab makeup'),('bk-003','7C02','AUSTPIC','2026-09-06','15:00','18:00','Hackathon Orientation Session');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `date` varchar(32) NOT NULL,
  `start_time` varchar(16) NOT NULL,
  `end_time` varchar(16) NOT NULL,
  `end_date` varchar(32) NOT NULL,
  `venue` varchar(128) NOT NULL,
  `organizer` varchar(128) NOT NULL,
  `capacity` int NOT NULL,
  `registered` int NOT NULL DEFAULT '0',
  `status` varchar(64) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES ('evt-001','AUSTPIC AI Build Hackathon','24-hour hackathon focused on building AI-powered applications. Open to all CSE students.','2026-09-10','09:00','09:00','2026-09-11','7C01','AUSTPIC',60,47,'upcoming'),('evt-002','Guest Lecture: Deep Learning in Medical Imaging','Industry talk by Dr. Iftekhar Ahmed (BUET) on practical applications of CNNs in Bangladeshi healthcare.','2026-09-08','14:00','16:00','2026-09-08','7C05','CSE Department',70,62,'upcoming'),('evt-003','Soft Computing Mid-Term Review Session','Extra prep session by FMS sir before the midterm. Covers fuzzy logic and neural network basics.','2026-09-06','16:00','18:00','2026-09-06','7A04','Prof. Dr. Faisal Muhammad Shah',45,38,'upcoming'),('evt-004','AUST CSE Carnival 8.0 Planning Meeting','Volunteers and organizers meeting to finalize event lineup, venue layout, and task assignments for CSE Carnival.','2026-09-05','15:30','17:00','2026-09-05','7C02','AUSTPIC',30,22,'upcoming'),('evt-005','Freshers\' Orientation — CSE Fall 2026','Welcome session for newly admitted CSE students. Department heads, club representatives, and senior students will speak.','2026-09-12','10:00','13:00','2026-09-12','7C05','CSE Department',70,55,'upcoming'),('evt-006','Workshop: Git & GitHub for Beginners','Hands-on workshop covering Git basics, branching, pull requests, and open-source contribution workflow.','2026-09-07','13:00','15:00','2026-09-07','7B05','AUSTPIC',30,30,'full'),('evt-007','Inter-University Programming Contest (IUPC) Selection','Internal selection round for AUST\'s IUPC team. Top performers will represent AUST.','2026-09-13','10:00','13:00','2026-09-13','7B06','AUSTPIC',30,18,'upcoming');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` varchar(64) NOT NULL,
  `student_id` varchar(64) NOT NULL,
  `name` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_event_student` (`event_id`,`student_id`),
  CONSTRAINT `registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registrations`
--

LOCK TABLES `registrations` WRITE;
/*!40000 ALTER TABLE `registrations` DISABLE KEYS */;
INSERT INTO `registrations` VALUES (1,'evt-001','20-40532','Sakibul Hassan'),(2,'evt-001','20-40511','Farhan Ahmed'),(3,'evt-001','20-40498','Tasnia Islam'),(4,'evt-002','20-40532','Sakibul Hassan'),(5,'evt-002','21-41205','Rafi Hossain'),(6,'evt-003','20-40532','Sakibul Hassan'),(7,'evt-003','20-40511','Farhan Ahmed'),(8,'evt-004','20-40532','Sakibul Hassan'),(9,'evt-006','21-41205','Rafi Hossain');
/*!40000 ALTER TABLE `registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` varchar(64) NOT NULL,
  `room_number` varchar(64) NOT NULL,
  `type` varchar(64) NOT NULL,
  `capacity` int NOT NULL,
  `equipment` text NOT NULL,
  `floor` int NOT NULL,
  `status` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_number` (`room_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES ('room-001','7A01','classroom',40,'[\"whiteboard\",\"projector\",\"AC\"]',7,'available'),('room-002','7A02','classroom',40,'[\"whiteboard\",\"projector\",\"AC\"]',7,'available'),('room-003','7A03','classroom',45,'[\"whiteboard\",\"projector\",\"AC\",\"smart board\"]',7,'available'),('room-004','7A04','classroom',45,'[\"whiteboard\",\"projector\",\"AC\"]',7,'available'),('room-005','7A05','classroom',40,'[\"whiteboard\",\"projector\",\"AC\"]',7,'available'),('room-006','7A06','classroom',40,'[\"whiteboard\",\"projector\",\"AC\"]',7,'available'),('room-007','7A07','classroom',50,'[\"whiteboard\",\"projector\",\"AC\",\"document camera\"]',7,'available'),('room-008','7B01','lab',30,'[\"computers\",\"AC\",\"projector\",\"whiteboard\"]',7,'available'),('room-009','7B02','lab',30,'[\"computers\",\"AC\",\"projector\"]',7,'available'),('room-010','7B03','lab',25,'[\"computers\",\"AC\",\"projector\"]',7,'available'),('room-011','7B04','lab',25,'[\"computers\",\"AC\"]',7,'available'),('room-012','7B05','lab',30,'[\"computers\",\"AC\",\"projector\",\"whiteboard\"]',7,'available'),('room-013','7B06','lab',30,'[\"computers\",\"AC\",\"projector\",\"whiteboard\"]',7,'available'),('room-014','7B07','lab',35,'[\"computers\",\"AC\",\"projector\",\"smart board\"]',7,'available'),('room-015','7B08','lab',35,'[\"computers\",\"AC\",\"projector\",\"whiteboard\"]',7,'available'),('room-016','7C01','seminar',60,'[\"projector\",\"AC\",\"whiteboard\",\"microphone\",\"podium\"]',7,'available'),('room-017','7C02','seminar',60,'[\"projector\",\"AC\",\"whiteboard\",\"microphone\"]',7,'available'),('room-018','7C03','seminar',55,'[\"projector\",\"AC\",\"whiteboard\",\"microphone\"]',7,'available'),('room-019','7C04','seminar',55,'[\"projector\",\"AC\",\"whiteboard\"]',7,'available'),('room-020','7C05','seminar',70,'[\"projector\",\"AC\",\"whiteboard\",\"microphone\",\"podium\",\"smart board\"]',7,'available');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` varchar(64) NOT NULL,
  `course` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `day` varchar(32) NOT NULL,
  `start_time` varchar(16) NOT NULL,
  `end_time` varchar(16) NOT NULL,
  `room` varchar(64) NOT NULL,
  `instructor` varchar(128) NOT NULL,
  `section` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES ('sch-001','CSE 4113','Pattern Recognition and Machine Learning','Sunday','13:00','13:50','7A07','Prof. Dr. Md. Shahriar Mahbub','B'),('sch-002','CSE 4173','Cyber Security','Sunday','11:20','12:10','7A03','Prof. Dr. Md. Shamim Akhter','CS'),('sch-003','CSE 4114','Pattern Recognition and Machine Learning Lab','Sunday','13:00','14:40','7B08','Prof. Dr. Md. Shahriar Mahbub','B1/B2'),('sch-004','CSE 4129','Formal Languages and Compilers','Sunday','08:00','08:50','7A05','Ms. Nusrat Jahan','B'),('sch-005','IPE 4111','Industrial Management','Sunday','09:40','10:30','7A05','TBA','B'),('sch-006','CSE 4113','Pattern Recognition and Machine Learning','Sunday','10:30','11:20','7A03','Prof. Dr. Md. Shahriar Mahbub','B'),('sch-007','CSE 4137','Soft Computing','Monday','16:20','17:10','7A03','Prof. Dr. Faisal Muhammad Shah','B'),('sch-008','CSE 4141','Data Warehousing and Mining','Monday','17:10','18:00','7A03','Mr. Saha Reno','DWM'),('sch-009','CSE 4113','Pattern Recognition and Machine Learning','Monday','13:00','13:50','7A07','Prof. Dr. Md. Shahriar Mahbub','B'),('sch-010','CSE 4173','Cyber Security','Monday','13:50','14:40','7A07','Prof. Dr. Md. Shamim Akhter','CS'),('sch-011','IPE 4111','Industrial Management','Tuesday','08:00','08:50','7C07','TBA','B'),('sch-012','IPE 4111','Industrial Management','Tuesday','08:50','09:40','7C07','TBA','B'),('sch-013','CSE 4138','Soft Computing Lab','Tuesday','11:20','13:00','7B01','Mr. Raihan Tanvir','B1/B2'),('sch-014','CSE 4130','Formal Languages and Compilers Lab','Wednesday','08:00','09:40','7B06','Ms. Nusrat Jahan','B1/B2'),('sch-015','CSE 4113','Pattern Recognition and Machine Learning','Wednesday','13:00','13:50','7A04','Prof. Dr. Md. Shahriar Mahbub','B'),('sch-016','CSE 4141','Data Warehousing and Mining','Wednesday','13:50','15:30','7A05','Mr. Saha Reno','DWM'),('sch-017','CSE 4173','Cyber Security','Wednesday','13:50','15:30','7A04','Prof. Dr. Md. Shamim Akhter','CS'),('sch-018','CSE 4137','Soft Computing','Wednesday','14:40','15:30','7A04','Prof. Dr. Faisal Muhammad Shah','B'),('sch-019','CSE 4141','Data Warehousing and Mining','Thursday','09:40','10:30','7A03','Mr. Saha Reno','DWM'),('sch-020','CSE 4174','Cyber Security Lab','Thursday','11:20','13:00','9A05','Ms. Nawrin Tabassum','CSGr-1'),('sch-021','CSE 4142','Data Warehousing and Mining Lab','Thursday','11:20','13:00','7B08','Mr. Saha Reno','DWMGr-1'),('sch-022','CSE 4129','Formal Languages and Compilers','Thursday','13:00','13:50','7A06','Ms. Nusrat Jahan','B'),('sch-023','CSE 4129','Formal Languages and Compilers','Thursday','13:50','14:40','7A06','Ms. Nusrat Jahan','B'),('sch-024','CSE 4137','Soft Computing','Thursday','14:40','15:30','7A06','Prof. Dr. Faisal Muhammad Shah','B');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-04 10:22:26
