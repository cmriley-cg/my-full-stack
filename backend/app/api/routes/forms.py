from fastapi import APIRouter, HTTPException
from datetime import datetime
# import threading
# import time
# import os
import azure.cognitiveservices.speech as speechsdk
from app.core.config import settings

# from app.api.deps import CurrentUser
from app.services.populate_forms import populate_form_from_transcript
from app.models import FormPopulateResponse, FormPopulateRequest, FormSaveRequest, FormSaveResponse

# In-memory storage (replace with database in production)
saved_forms = []

router = APIRouter(prefix="/forms", tags=["forms"])

# Routings

@router.post("/autofill", response_model=FormPopulateResponse)
async def auto_fill(req: FormPopulateRequest):
    if req.form_type != "maintenance_report":
        # easy extension point: switch on form_type later
        raise HTTPException(status_code=400, detail=f"Unsupported form_type: {req.form_type}")
    try:
        print(req.transcript)
        result = await populate_form_from_transcript(req.transcript)
        return FormPopulateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as other:
        # avoid leaking model/provider internals
        #print(other) # DEBUG ONLY
        raise HTTPException(status_code=500, detail="Form extraction failed")
    

@router.post("/testfill", response_model=FormPopulateResponse)
async def auto_fill(req: FormPopulateRequest):
    if req.form_type != "maintenance_report":
        # easy extension point: switch on form_type later
        raise HTTPException(status_code=400, detail=f"Unsupported form_type: {req.form_type}")
    try:
        result = await populate_form_from_transcript(req.transcript)
        return FormPopulateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # avoid leaking model/provider internals
        raise HTTPException(status_code=500, detail="Form extraction failed")
    

@router.post("/save", response_model=FormSaveResponse)
async def save_form(req: FormSaveRequest):
    """Save a completed form to the database"""
    if req.form_type != "maintenance_report":
        raise HTTPException(status_code=400, detail=f"Unsupported form_type: {req.form_type}")
    
    if not req.fields:
        raise HTTPException(status_code=400, detail="No fields provided")
    
    try:
        # Create form record
        form_record = {
            "id": len(saved_forms) + 1,  # Simple ID generation
            "form_type": req.form_type,
            "fields": req.fields,
            "transcript": req.transcript,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Save to storage (in-memory for now)
        saved_forms.append(form_record)
        
        # TODO: Replace with actual database save
        # Example with SQLAlchemy:
        # db_form = MaintenanceReport(**form_record)
        # db.add(db_form)
        # db.commit()
        # db.refresh(db_form)
        
        return FormSaveResponse(
            success=True,
            message="Form saved successfully",
            form_id=form_record["id"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save form: {str(e)}")


@router.get("/saved")
async def get_saved_forms():
    """Retrieve all saved forms (for debugging/testing)"""
    return {"forms": saved_forms, "count": len(saved_forms)}