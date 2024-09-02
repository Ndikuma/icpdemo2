import Array "mo:base/Array";

actor {
  stable var students : [Student] = [];
  stable var courses : [Course] = [];
  stable var studentCourses : [(Text, Course)] = [];

  public type Student = {
    firstName : Text;
    lastName : Text;
    school : Text;
  };

  public type Course = {
    courseId : Text;
    courseName : Text;
  };

  public query func getStudents() : async [Student] {
    return students;
  };

  public query func getCourses() : async [Course] {
    return courses;
  };

  public func addStudent(firstName : Text, lastName : Text, school : Text) : async () {
    let newStudent : [Student] = [{ firstName; lastName; school }];
    students := Array.append(students, newStudent);
  };

  public func addCourse(courseId : Text, courseName : Text) : async () {
    let newCourse : [Course] = [{ courseId; courseName }];
    courses := Array.append(courses, newCourse);
  };

  public func assignCourseToStudent(studentId : Text, courseId : Text) : async () {
    let courseOpt = Array.find<Course>(
      courses,
      func(c : Course) : Bool {
        c.courseId == courseId;
      },
    );

    switch (courseOpt) {
      case (?course) {
        studentCourses := Array.append(studentCourses, [(studentId, course)]);
      };
      case (null) {
        // Handle course not found
      };
    };
  };

  public query func getStudentCourses(studentId : Text) : async [Course] {
    let studentCoursesList : [Course] = Array.map<(Text, Course), Course>(
      Array.filter<(Text, Course)>(
        studentCourses,
        func((sId, _)) : Bool {
          sId == studentId;
        },
      ),
      func((_, course)) : Course {
        course;
      },
    );
    return studentCoursesList;
  };
};