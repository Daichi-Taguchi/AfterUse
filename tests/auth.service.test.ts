describe('auth.service', () => {
  it('allows new user registration and treats subsequent login as existing user', async () => {
    const authService = await import('../src/services/auth.service');

    const firstLogin = await authService.signInWithPhoneOtp('+6280000000001', '123456');
    expect(firstLogin.isNewUser).toBe(true);
    expect(firstLogin.user.name).toBe('');

    const updated = await authService.updateUserProfile(firstLogin.user.id, {
      name: 'New User',
      organization: 'ITB Ganesha',
      email: 'new@example.com'
    });
    expect(updated.name).toBe('New User');

    await authService.signOutUser();

    const secondLogin = await authService.signInWithPhoneOtp('+6280000000001', '123456');
    expect(secondLogin.isNewUser).toBe(false);
    expect(secondLogin.user.name).toBe('New User');
  });
});
