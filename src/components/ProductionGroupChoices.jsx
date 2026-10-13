import './GroupedProductPicker.css';
import React from 'react';
export default function ProductionGroupChoices({groups,renderGroup}){
 const mains=[...new Set(groups.filter(group=>group.groupKind!=='MAIN').map(group=>group.mainGroupName || 'Needs classification'))];
 return <div className="production-group-choices">{mains.map(main=><section key={main}><strong>{main}</strong><div className="production-group-choices-grid">{groups.filter(group=>group.groupKind!=='MAIN'&&(group.mainGroupName || 'Needs classification')===main).map(renderGroup)}</div></section>)}</div>;
}
