export const getCurrentDateWithTimezoneOffset = () => {
  const date = new Date();
  const tzOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, -1);

  return localISOTime.split("T")[0]; // Return only the date part (YYYY-MM-DD)
};
