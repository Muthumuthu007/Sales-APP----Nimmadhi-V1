import {useEffect,useRef} from 'react';
import {salesIssueMessage} from '../utils/salesValidation';

export default function SalesValidationNotice({open,issues,onClose,onFix}){
 const dialog=useRef(null);
 useEffect(()=>{
  if(open && issues.length){if(!dialog.current.open)dialog.current.showModal();}
  else if(dialog.current.open)dialog.current.close();
 },[open,issues]);
 const fix=message=>{dialog.current.close();onFix(message);};
 return <dialog ref={dialog} className="sales-validation-dialog" aria-labelledby="sales-validation-title" aria-describedby="sales-validation-description" onCancel={event=>{event.preventDefault();onClose();}}>
  <h2 id="sales-validation-title">Please complete these details</h2>
  <p id="sales-validation-description">Some details are missing or need correcting. Please fill them in to proceed. Your entered details are saved in this form.</p>
  <ul>{issues.map((message,index)=><li key={`${message}-${index}`}><span>{salesIssueMessage(message)}</span><button type="button" onClick={()=>fix(message)}>Go to field →</button></li>)}</ul>
  <button type="button" className="sales-validation-continue" onClick={()=>fix(issues[0])}>Fill in missing details</button>
  <button type="button" className="sales-validation-close" onClick={onClose}>Close notification</button>
 </dialog>;
}
