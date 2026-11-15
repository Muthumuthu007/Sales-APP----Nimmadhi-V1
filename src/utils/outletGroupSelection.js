/** Never submit hidden main-group headings or retired assignment IDs. */
export function outletGroupSelection(access,selected=access?.allowedGroupIds||[]) {
 const editable=new Set((access?.groups||[]).filter(group=>group.groupKind!=='MAIN').map(group=>group.groupId));
 return [...new Set(selected.filter(id=>editable.has(id)))];
}
