from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import datetime

from app.core.database import get_db
from app.core.deps import get_current_student
from app.models.user import Student
from app.models.plan import AIFollowUpPlan, AIFollowUpTask
from app.core.ai_service import generate_recovery_plan

router = APIRouter(tags=["plans"])

@router.post("/generate")
async def generate_plan(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Generates a new AI Follow-up Recovery Plan based on the student's recent context.
    Archives any existing active plans.
    """
    # 1. Archive existing active plans
    active_plans = db.query(AIFollowUpPlan).filter(
        AIFollowUpPlan.student_id == student.id,
        AIFollowUpPlan.status == "active"
    ).all()
    
    for plan in active_plans:
        plan.status = "archived"
    db.commit()
    
    # 2. Gather context
    student_context = f"Student {student.anonymous_token} has recently reported high academic stress and sleep deprivation. They are in year {student.year} of {student.department}."
    
    # 3. Generate from AI
    generated_plan = await generate_recovery_plan(student_context)
    
    # 4. Save Plan
    new_plan = AIFollowUpPlan(
        student_id=student.id,
        title=generated_plan.get("title", "Recovery Plan"),
        rationale=generated_plan.get("rationale", "We created this plan to help you feel better."),
        status="active"
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    # 5. Save Tasks
    tasks_data = generated_plan.get("tasks", [])
    for task_data in tasks_data:
        task = AIFollowUpTask(
            plan_id=new_plan.id,
            title=task_data.get("title", "Action Item"),
            description=task_data.get("description", ""),
            day_number=task_data.get("day_number", 1)
        )
        db.add(task)
        
    db.commit()
    db.refresh(new_plan)
    
    # 6. Format Response
    return {
        "id": new_plan.id,
        "title": new_plan.title,
        "rationale": new_plan.rationale,
        "status": new_plan.status,
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "day_number": t.day_number,
                "completed": t.completed
            } for t in new_plan.tasks
        ]
    }


@router.get("")
@router.get("/active")
def get_active_plan(
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Retrieves the currently active recovery plan.
    """
    plan = db.query(AIFollowUpPlan).filter(
        AIFollowUpPlan.student_id == student.id,
        AIFollowUpPlan.status == "active"
    ).order_by(desc(AIFollowUpPlan.created_at)).first()
    
    if not plan:
        return None
        
    return {
        "id": plan.id,
        "title": plan.title,
        "rationale": plan.rationale,
        "status": plan.status,
        "created_at": plan.created_at,
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "day_number": t.day_number,
                "completed": t.completed,
                "completed_at": t.completed_at
            } for t in sorted(plan.tasks, key=lambda x: x.day_number)
        ]
    }


@router.post("/tasks/{task_id}/complete")
def complete_task(
    task_id: int,
    student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Toggles the completion status of a specific task.
    """
    task = db.query(AIFollowUpTask).join(AIFollowUpPlan).filter(
        AIFollowUpTask.id == task_id,
        AIFollowUpPlan.student_id == student.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task.completed = not task.completed
    task.completed_at = datetime.datetime.utcnow() if task.completed else None
    
    # Check if all tasks are complete
    plan = task.plan
    all_complete = all(t.completed for t in plan.tasks)
    if all_complete:
        plan.status = "completed"
        
    db.commit()
    
    return {"status": "success", "task_completed": task.completed, "plan_status": plan.status}
