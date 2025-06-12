export function formatCourseNames(
  isAllCourses: boolean,
  courseNames: string[] | undefined,
  maxChar: number
): string {
  if (isAllCourses) return "All courses";
  if (!courseNames || courseNames.length === 0) return "-";

  let result = "";
  let totalLength = 0;
  let i = 0;

  for (; i < courseNames.length; i++) {
    const name = courseNames[i];
    const addLength = name.length + (i === 0 ? 0 : 2);
    if (totalLength + addLength > maxChar) {
      if (i === 0) {
        return name.slice(0, maxChar) + "...";
      }
      break;
    }
    result += (i === 0 ? "" : ", ") + name;
    totalLength += addLength;
  }

  if (i < courseNames.length) {
    result += ", ...";
  }

  return result;
}
