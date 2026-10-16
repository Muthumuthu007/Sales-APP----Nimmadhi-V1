export function isLocationCreateDisabled({saving,locationType,groupsLoading,selectedGroupIds}) {
 return Boolean(saving || (locationType === 'OUTLET' && (groupsLoading || !selectedGroupIds.length)));
}
