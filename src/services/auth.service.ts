import { User } from '../types';
import { mockAdminUser, mockUser } from '../data/mockData';

interface AuthResult {
  user: User;
  isNewUser: boolean;
}

let currentUser: User | null = null;
const usersByPhone = new Map<string, User>([
  [normalizePhone(mockUser.phone), mockUser],
  [normalizePhone(mockAdminUser.phone), mockAdminUser]
]);

function normalizePhone(phone: string): string {
  const raw = phone.trim();
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export async function signInWithPhoneOtp(phone: string, otp: string): Promise<AuthResult> {
  if (!phone) {
    throw new Error('Please enter a phone number.');
  }

  const normalizedPhone = normalizePhone(phone);
  const existingUser = usersByPhone.get(normalizedPhone);
  const isNewUser = !existingUser;
  const user =
    existingUser ??
    ({
      ...mockUser,
      id: `user_${Date.now()}`,
      role: 'user',
      phone: normalizedPhone,
      name: '',
      organization: '',
      totalPoints: 0,
      totalWeight: 0,
      badges: [],
      joinedAt: new Date()
    } satisfies User);

  usersByPhone.set(normalizedPhone, user);

  currentUser = user;
  return { user, isNewUser };
}

export async function updateUserProfile(
  userId: string,
  payload: Pick<User, 'name' | 'organization' | 'email'>
): Promise<User> {
  if (!currentUser || currentUser.id !== userId) {
    throw new Error('User not found.');
  }

  currentUser = { ...currentUser, ...payload };
  usersByPhone.set(normalizePhone(currentUser.phone), currentUser);
  return currentUser;
}

export async function signOutUser(): Promise<void> {
  currentUser = null;
}

export async function listUsers(): Promise<User[]> {
  return Array.from(usersByPhone.values());
}
