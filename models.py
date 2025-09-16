# models.py
from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

student_course_association = Table('student_course_association', Base.metadata,
    Column('student_id', Integer, ForeignKey('students.id'), primary_key=True),
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True)
)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # credits = Column(Integer, nullable=False) # REMOVED THIS LINE
    # --- ADDED THESE TWO LINES ---
    theory_credits = Column(Integer, default=0)
    practical_credits = Column(Integer, default=0)
    # ---------------------------
    enrolled_students = relationship("Student", secondary=student_course_association, back_populates="enrolled_courses")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    expertise = Column(String, nullable=True)
    email = Column(String, nullable=True, unique=True)

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    type = Column(String, nullable=True)

class StudentGroup(Base):
    __tablename__ = "student_groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    students = relationship("Student", back_populates="group")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    reg_no = Column(String, unique=True, index=True)
    group_id = Column(Integer, ForeignKey('student_groups.id'))
    group = relationship("StudentGroup", back_populates="students")
    enrolled_courses = relationship("Course", secondary=student_course_association, back_populates="enrolled_students")