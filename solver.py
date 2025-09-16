# solver.py
from ortools.sat.python import cp_model

def generate_the_perfect_timetable(courses, teachers, rooms, students_with_courses, time_slots):
    model = cp_model.CpModel()

    # --- 1. CREATE DECISION VARIABLES ---
    assignments = {}
    for course in courses:
        for teacher in teachers:
            for room in rooms:
                for slot in time_slots:
                    assignments[(course['id'], teacher['id'], room['id'], slot['id'])] = model.NewBoolVar(
                        f"assign_c{course['id']}_t{teacher['id']}_r{room['id']}_s{slot['id']}"
                    )

    # --- 2. ADD HARD CONSTRAINTS ---
    for course in courses:
        model.AddExactlyOne([assignments[(course['id'], t['id'], r['id'], s['id'])] for t in teachers for r in rooms for s in time_slots])

    for teacher in teachers:
        for slot in time_slots:
            model.AddAtMostOne([assignments[(c['id'], teacher['id'], r['id'], slot['id'])] for c in courses for r in rooms])

    for room in rooms:
        for slot in time_slots:
            model.AddAtMostOne([assignments[(c['id'], t['id'], room['id'], slot['id'])] for c in courses for t in teachers])

    for student in students_with_courses:
        for slot in time_slots:
            student_classes_at_slot = [assignments[(c_id, t['id'], r['id'], slot['id'])] for c_id in student['enrolled_course_ids'] for t in teachers for r in rooms]
            if student_classes_at_slot:
                model.AddAtMostOne(student_classes_at_slot)
    
    # --- 3. RUN THE SOLVER ---
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    # --- 4. PROCESS THE RESULTS ---
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        schedule = []
        for (course_id, teacher_id, room_id, slot_id), var in assignments.items():
            if solver.Value(var) == 1:
                schedule.append({"course_id": course_id, "teacher_id": teacher_id, "room_id": room_id, "time_slot_id": slot_id})
        return schedule
    else:
        return {"error": "Could not find a valid timetable with the given constraints."}