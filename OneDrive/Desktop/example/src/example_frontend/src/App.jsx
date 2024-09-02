import React, { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { example_backend } from "declarations/example_backend";
import "./index.scss";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    school: "",
  });
  const [newCourse, setNewCourse] = useState({ courseId: "", courseName: "" });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const authClientPromise = AuthClient.create();

  const signIn = async () => {
    const authClient = await authClientPromise;
    const internetIdentityUrl =
      process.env.NODE_ENV === "production"
        ? undefined
        : `http://localhost:4943/?canisterId=${process.env.INTERNET_IDENTITY_CANISTER_ID}`;

    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: () => resolve(undefined),
      });
    });

    const identity = authClient.getIdentity();
    updateIdentity(identity);
    setIsLoggedIn(true);
  };

  const signOut = async () => {
    const authClient = await authClientPromise;
    await authClient.logout();
    updateIdentity(null);
  };

  const updateIdentity = (identity) => {
    if (identity) {
      setPrincipal(identity.getPrincipal());
      // Create Actor with HttpAgent
      const agent = new HttpAgent();
      const actor = Actor.createActor(example_backend, { agent: agent });
      example_backend.setActor(actor); // Set the actor for example_backend
    } else {
      setPrincipal(null);
      example_backend.setActor(null); // Clear the actor
    }
  };
  useEffect(() => {
    const checkLoginStatus = async () => {
      const authClient = await authClientPromise;
      const isAuthenticated = await authClient.isAuthenticated();
      setIsLoggedIn(isAuthenticated);
      if (isAuthenticated) {
        const identity = authClient.getIdentity();
        updateIdentity(identity);
        const storedStudents = localStorage.getItem("students");
        const storedCourses = localStorage.getItem("courses");
        if (storedStudents && storedCourses) {
          setStudents(JSON.parse(storedStudents));
          setCourses(JSON.parse(storedCourses));
        } else {
          fetchStudents();
          fetchCourses();
        }
      }
    };

    checkLoginStatus();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsList = await example_backend.getStudents();
      console.log("Fetched students:", studentsList);
      setStudents(studentsList);
      localStorage.setItem("students", JSON.stringify(studentsList)); // Store fetched students in local storage
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const coursesList = await example_backend.getCourses();
      console.log("Fetched courses:", coursesList);
      setCourses(coursesList);
      localStorage.setItem("courses", JSON.stringify(coursesList)); // Store fetched courses in local storage
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchStudentCourses = async (studentId) => {
    try {
      const studentCoursesList = await example_backend.getStudentCourses(
        studentId
      );
      console.log("Fetched student courses:", studentCoursesList);
      setStudentCourses(studentCoursesList);
    } catch (error) {
      console.error("Failed to fetch student courses:", error);
    }
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();
    console.log("Submitting student:", newStudent);

    try {
      await example_backend.addStudent(
        newStudent.firstName,
        newStudent.lastName,
        newStudent.school
      );
      console.log("Student added successfully");
      setNewStudent({ firstName: "", lastName: "", school: "" });
      setShowAddStudentForm(false);
      fetchStudents(); // Fetch students after adding a new student
    } catch (error) {
      console.error("Failed to add student:", error);
    }
  };

  const handleAddCourse = async (event) => {
    event.preventDefault();
    console.log("Submitting course:", newCourse);

    try {
      await example_backend.addCourse(newCourse.courseId, newCourse.courseName);
      console.log("Course added successfully");
      setNewCourse({ courseId: "", courseName: "" });
      setShowAddCourseForm(false);
      fetchCourses(); // Fetch courses after adding a new course
    } catch (error) {
      console.error("Failed to add course:", error);
    }
  };

  const handleAssignCourseToStudent = async () => {
    console.log(
      "Assigning course:",
      selectedCourseId,
      "to student:",
      selectedStudentId
    );

    try {
      await example_backend.assignCourseToStudent(
        selectedStudentId,
        selectedCourseId
      );
      console.log("Course assigned successfully");
      fetchStudentCourses(selectedStudentId); // Fetch student courses after assignment
    } catch (error) {
      console.error("Failed to assign course:", error);
    }
  };

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <h1>Students and Courses Management (Example)</h1>
      {isLoggedIn ? (
        <>
          <p>Welcome back, {principal ? principal.toString() : "User"}!</p>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={() => setShowAddStudentForm(true)}>
            Add New Student
          </button>
          <button onClick={() => setShowAddCourseForm(true)}>
            Add New Course
          </button>
          <button onClick={fetchStudents}>Fetch Students</button>
          <button onClick={fetchCourses}>Fetch Courses</button>
          <h2>Student List</h2>
          <ul>
            {students.map((student, index) => (
              <li key={index}>
                {student.firstName} {student.lastName} - {student.school}
              </li>
            ))}
          </ul>
          {showAddStudentForm && (
            <form onSubmit={handleAddStudent}>
              <label>
                First Name:
                <input
                  type="text"
                  value={newStudent.firstName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, firstName: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Last Name:
                <input
                  type="text"
                  value={newStudent.lastName}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, lastName: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                School:
                <input
                  type="text"
                  value={newStudent.school}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, school: e.target.value })
                  }
                  required
                />
              </label>
              <button type="submit">Save Student</button>
            </form>
          )}
          <h2>Course List</h2>
          <ul>
            {courses.map((course, index) => (
              <li key={index}>
                {course.courseId} - {course.courseName}
              </li>
            ))}
          </ul>
          {showAddCourseForm && (
            <form onSubmit={handleAddCourse}>
              <label>
                Course ID:
                <input
                  type="text"
                  value={newCourse.courseId}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, courseId: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Course Name:
                <input
                  type="text"
                  value={newCourse.courseName}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, courseName: e.target.value })
                  }
                  required
                />
              </label>
              <button type="submit">Save Course</button>
            </form>
          )}
          <h2>Assign Course to Student</h2>
          <label>
            Select Student:
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Select a student</option>
              {students.map((student, index) => (
                <option
                  key={index}
                  value={student.firstName + " " + student.lastName}
                >
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Select Course:
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Select a course</option>
              {courses.map((course, index) => (
                <option key={index} value={course.courseId}>
                  {course.courseName}
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleAssignCourseToStudent}>Assign Course</button>
          {selectedStudentId && (
            <>
              <h2>Courses for {selectedStudentId}</h2>
              <button onClick={() => fetchStudentCourses(selectedStudentId)}>
                Fetch Courses for Student
              </button>
              <ul>
                {studentCourses.map((course, index) => (
                  <li key={index}>
                    {course.courseId} - {course.courseName}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <button onClick={signIn}>Sign In</button>
      )}
    </main>
  );
}

export default App;
