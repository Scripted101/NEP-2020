# schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- Base Schemas ---
class CourseBase(BaseModel):
    name: str
    # credits: int # REMOVED THIS
    # --- ADDED THESE TWO LINES ---
    theory_credits: Optional[int] = Field(default=0)
    practical_credits: Optional[int] = Field(default=0)
    # ---------------------------

class TeacherBase(BaseModel):
    name: str
    expertise: Optional[str] = None
    email: Optional[str] = None

class RoomBase(BaseModel):
    name: str
    capacity: int
    type: Optional[str] = None

class StudentGroupBase(BaseModel):
    name: str
    size: int
    
class StudentBase(BaseModel):
    name: str
    reg_no: str

# --- Create Schemas ---
class CourseCreate(CourseBase):
    pass

class TeacherCreate(TeacherBase):
    pass

class RoomCreate(RoomBase):
    pass

class StudentGroupCreate(StudentGroupBase):
    pass

class StudentCreate(StudentBase):
    group_name: str

# --- Full Schemas with Relationships ---
class Course(CourseBase):
    id: int
    class Config:
        from_attributes = True

class Student(StudentBase):
    id: int
    class Config:
        from_attributes = True

class StudentGroup(StudentGroupBase):
    id: int
    class Config:
        from_attributes = True

class Room(RoomBase):
    id: int
    class Config:
        from_attributes = True

class Teacher(TeacherBase):
    id: int
    class Config:
        from_attributes = True

# --- Schema for PDF Generation ---
class ScheduleEntry(BaseModel):
    course_name: str
    teacher_name: str
    room_name: str
    time_slot_id: str