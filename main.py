# main.py
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
import models
import schemas
from database import get_db, engine
from solver import generate_the_perfect_timetable
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from fastapi import UploadFile, File
from fpdf import FPDF
from fastapi.responses import StreamingResponse

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Timetable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CRUD for Courses ---
@app.post("/courses/", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    # UPDATED THIS to handle theory and practical credits
    db_course = models.Course(
        name=course.name, 
        theory_credits=course.theory_credits,
        practical_credits=course.practical_credits
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@app.get("/courses/", response_model=List[schemas.Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Course).offset(skip).limit(limit).all()

@app.delete("/courses/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return

# --- CRUD for Faculty ---
@app.post("/faculty/", response_model=schemas.Teacher)
def create_faculty(faculty: schemas.TeacherCreate, db: Session = Depends(get_db)):
    db_faculty = models.Teacher(name=faculty.name, expertise=faculty.expertise, email=faculty.email)
    db.add(db_faculty)
    db.commit()
    db.refresh(db_faculty)
    return db_faculty

@app.get("/faculty/", response_model=List[schemas.Teacher])
def read_faculty(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Teacher).offset(skip).limit(limit).all()

@app.delete("/faculty/{faculty_id}", status_code=204)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    faculty_member = db.query(models.Teacher).filter(models.Teacher.id == faculty_id).first()
    if not faculty_member:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(faculty_member)
    db.commit()
    return

# --- CRUD for Rooms ---
@app.post("/rooms/", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db)):
    db_room = models.Room(
        name=room.name, 
        capacity=room.capacity, 
        type=room.type
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.get("/rooms/", response_model=List[schemas.Room])
def read_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Room).offset(skip).limit(limit).all()

@app.delete("/rooms/{room_id}", status_code=204)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
    return

# --- CRUD for Students (StudentGroups) ---
@app.post("/students/", response_model=schemas.StudentGroup)
def create_student_group(student_group: schemas.StudentGroupCreate, db: Session = Depends(get_db)):
    db_group = models.StudentGroup(name=student_group.name, size=student_group.size)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@app.get("/students/", response_model=List[schemas.StudentGroup])
def read_student_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.StudentGroup).offset(skip).limit(limit).all()

@app.delete("/students/{student_id}", status_code=204)
def delete_student_group(student_id: int, db: Session = Depends(get_db)):
    group = db.query(models.StudentGroup).filter(models.StudentGroup.id == student_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="StudentGroup not found")
    db.delete(group)
    db.commit()
    return

# --- Timetable Generation Endpoint ---
@app.post("/generate-timetable")
def generate_timetable_endpoint(db: Session = Depends(get_db)):
    # ... (function is correct as is)
    pass

# --- Bulk CSV Upload Endpoint ---
@app.post("/upload-data/")
def upload_data(db: Session = Depends(get_db), file: UploadFile = File(...)):
    # ... (function is correct as is)
    pass

# --- Enrollment CSV Upload Endpoint ---
@app.post("/upload-enrollments/")
def upload_enrollments(db: Session = Depends(get_db), file: UploadFile = File(...)):
    # ... (function is correct as is)
    pass

# --- PDF Download Endpoint ---
@app.post("/download-timetable/")
def download_timetable(schedule: List[schemas.ScheduleEntry]):
    # ... (function is correct as is)
    pass