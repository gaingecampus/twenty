export const matchesDatabaseEvent = (
  eventName: string,
  subscription: string,
): boolean => {
  const [objectName, operation] = eventName.split('.');

  return [
    `${objectName}.${operation}`,
    `*.${operation}`,
    `${objectName}.*`,
    '*.*',
  ].includes(subscription);
};
