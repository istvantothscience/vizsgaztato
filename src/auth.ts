import { STORAGE_KEYS, TEACHER_USERNAME_HASH, TEACHER_PASSWORD_HASH } from "./constants";

async function hashString(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const loginTeacher = async (username: string, password: string): Promise<boolean> => {
  const userHash = await hashString(username);
  const passHash = await hashString(password);

  if (userHash === TEACHER_USERNAME_HASH && passHash === TEACHER_PASSWORD_HASH) {
    localStorage.setItem(STORAGE_KEYS.TEACHER_AUTH, "true");
    return true;
  }
  return false;
};

export const logoutTeacher = () => {
  localStorage.removeItem(STORAGE_KEYS.TEACHER_AUTH);
};

export const isTeacherLoggedIn = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.TEACHER_AUTH) === "true";
};
