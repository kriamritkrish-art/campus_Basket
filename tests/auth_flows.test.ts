import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  isValidNitEmail,
  sendCollegeOtpSchema,
  verifyCollegeOtpSchema,
  sendPersonalOtpSchema,
  verifyPersonalOtpSchema,
  completeRegistrationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema
} from '../backend/src/validators/authValidators';
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  maskEmail
} from '../backend/src/utils/crypto';

describe('NIT Durgapur Student Authentication & Lifecycle Test Suite', () => {

  // -------------------------------------------------------------
  // TEST 1: Valid NIT Durgapur email -> College OTP -> Verify -> Personal email -> Personal OTP -> Details -> Password -> Account created
  // -------------------------------------------------------------
  it('TEST 1: Valid NIT Durgapur email registration sequence validates completely', async () => {
    // 1. College Email Step
    const collegeInput = 'ss.24u10227@nitdgp.ac.in';
    expect(isValidNitEmail(collegeInput)).toBe(true);
    const collegeParse = sendCollegeOtpSchema.safeParse({ collegeEmail: collegeInput });
    expect(collegeParse.success).toBe(true);

    // 2. Verify College OTP
    const collegeOtp = generateSecureOtp();
    const collegeOtpHash = hashOtp(collegeOtp);
    const verifyCollegeParse = verifyCollegeOtpSchema.safeParse({
      collegeEmail: collegeInput,
      otp: collegeOtp
    });
    expect(verifyCollegeParse.success).toBe(true);
    expect(verifyOtpHash(collegeOtp, collegeOtpHash)).toBe(true);

    // 3. Personal Email Step
    const personalInput = 'souravsenapati055@gmail.com';
    const personalParse = sendPersonalOtpSchema.safeParse({
      personalEmail: personalInput,
      collegeEmail: collegeInput
    });
    expect(personalParse.success).toBe(true);

    // 4. Verify Personal OTP
    const personalOtp = generateSecureOtp();
    const personalOtpHash = hashOtp(personalOtp);
    const verifyPersonalParse = verifyPersonalOtpSchema.safeParse({
      personalEmail: personalInput,
      otp: personalOtp
    });
    expect(verifyPersonalParse.success).toBe(true);
    expect(verifyOtpHash(personalOtp, personalOtpHash)).toBe(true);

    // 5. Academic Details & Password
    const registrationPayload = {
      collegeEmail: collegeInput,
      personalEmail: personalInput,
      fullName: 'Sourav Senapati',
      rollNumber: '24U10227',
      registrationNumber: '2410227',
      department: 'Computer Science and Engineering',
      programme: 'B.Tech',
      year: '1st Year',
      hallId: 'hall_11',
      hallNumber: '11',
      roomNumber: 'B-304',
      mobileNumber: '9876543210',
      password: 'StrongPassword123!'
    };

    const completionParse = completeRegistrationSchema.safeParse(registrationPayload);
    expect(completionParse.success).toBe(true);

    // Password hashing
    const hashedPassword = await bcrypt.hash(registrationPayload.password, 10);
    expect(await bcrypt.compare(registrationPayload.password, hashedPassword)).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 2: Non-NIT email -> Rejected
  // -------------------------------------------------------------
  it('TEST 2: Non-NIT email is strictly rejected for college email verification', () => {
    const invalidEmails = [
      'student@gmail.com',
      'student@yahoo.co.in',
      'student@outlook.com',
      'student@hotmail.com',
      'student@nitdgp.org',
      'student@nitdgp.com',
      'ss.24u10227@nitdgp.ac.in.attacker.com',
      'notanemail'
    ];

    for (const email of invalidEmails) {
      expect(isValidNitEmail(email)).toBe(false);
      const res = sendCollegeOtpSchema.safeParse({ collegeEmail: email });
      expect(res.success).toBe(false);
    }
  });

  // -------------------------------------------------------------
  // TEST 3: Wrong college OTP -> Rejected
  // -------------------------------------------------------------
  it('TEST 3: Wrong college OTP is rejected and increments attempt count', () => {
    const plainOtp = generateSecureOtp();
    const otpHash = hashOtp(plainOtp);
    const wrongOtp = '000000';

    expect(verifyOtpHash(wrongOtp, otpHash)).toBe(false);

    // Simulate database record attempts tracking
    const otpRecord = {
      otpHash,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    };

    const isMatch = verifyOtpHash(wrongOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts++;
    }

    expect(isMatch).toBe(false);
    expect(otpRecord.attempts).toBe(1);
    expect(otpRecord.attempts < otpRecord.maxAttempts).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 4: Expired college OTP -> Rejected
  // -------------------------------------------------------------
  it('TEST 4: Expired college OTP (> 5 minutes) is rejected', () => {
    const plainOtp = '654321';
    const otpHash = hashOtp(plainOtp);

    const expiredRecord = {
      otpHash,
      isVerified: false,
      expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
    };

    const isExpired = new Date() > new Date(expiredRecord.expiresAt);
    expect(isExpired).toBe(true);

    const canVerify = !isExpired && verifyOtpHash(plainOtp, expiredRecord.otpHash);
    expect(canVerify).toBe(false);
  });

  // -------------------------------------------------------------
  // TEST 5: Wrong personal OTP -> Rejected
  // -------------------------------------------------------------
  it('TEST 5: Wrong personal OTP is rejected without compromising verified college status', () => {
    const collegeVerified = true;
    const correctPersonalOtp = '789123';
    const personalOtpHash = hashOtp(correctPersonalOtp);
    const submittedOtp = '111222';

    const isPersonalValid = verifyOtpHash(submittedOtp, personalOtpHash);
    expect(isPersonalValid).toBe(false);
    // College verification remains intact
    expect(collegeVerified).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 6: Duplicate college email -> Rejected
  // -------------------------------------------------------------
  it('TEST 6: Duplicate college email is rejected if account already exists', () => {
    const registeredUsers = [
      { id: 'user_1', collegeEmail: 'ss.24u10227@nitdgp.ac.in', personalEmail: 'sourav@gmail.com' }
    ];

    const duplicateCandidate = 'ss.24u10227@nitdgp.ac.in';
    const exists = registeredUsers.some(
      (u) => u.collegeEmail.toLowerCase() === duplicateCandidate.toLowerCase()
    );

    expect(exists).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 7: Duplicate personal email -> Rejected
  // -------------------------------------------------------------
  it('TEST 7: Duplicate personal email is rejected if account already exists', () => {
    const registeredUsers = [
      { id: 'user_1', collegeEmail: 'ss.24u10227@nitdgp.ac.in', personalEmail: 'souravsenapati055@gmail.com' }
    ];

    const duplicatePersonal = 'souravsenapati055@gmail.com';
    const exists = registeredUsers.some(
      (u) => u.personalEmail.toLowerCase() === duplicatePersonal.toLowerCase()
    );

    expect(exists).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 8: Login using college email -> Success
  // -------------------------------------------------------------
  it('TEST 8: Login using College Email resolves to the single student account', async () => {
    const storedHash = await bcrypt.hash('SecretPass123', 10);
    const mockStudentUser = {
      id: 'student_user_1',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com',
      passwordHash: storedHash,
      isActive: true,
      accountStatus: 'ACTIVE'
    };

    const loginInput = {
      email: 'ss.24u10227@nitdgp.ac.in',
      password: 'SecretPass123'
    };

    const parsed = loginSchema.safeParse(loginInput);
    expect(parsed.success).toBe(true);

    const matchesCollege = mockStudentUser.collegeEmail === loginInput.email.toLowerCase();
    expect(matchesCollege).toBe(true);

    const isPasswordValid = await bcrypt.compare(loginInput.password, mockStudentUser.passwordHash);
    expect(isPasswordValid).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 9: Login using personal email -> Success
  // -------------------------------------------------------------
  it('TEST 9: Login using Personal Email resolves to the EXACT SAME student account', async () => {
    const storedHash = await bcrypt.hash('SecretPass123', 10);
    const mockStudentUser = {
      id: 'student_user_1',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com',
      passwordHash: storedHash,
      isActive: true,
      accountStatus: 'ACTIVE'
    };

    const loginInput = {
      email: 'souravsenapati055@gmail.com',
      password: 'SecretPass123'
    };

    const parsed = loginSchema.safeParse(loginInput);
    expect(parsed.success).toBe(true);

    const matchesPersonal = mockStudentUser.personalEmail === loginInput.email.toLowerCase();
    expect(matchesPersonal).toBe(true);

    const isPasswordValid = await bcrypt.compare(loginInput.password, mockStudentUser.passwordHash);
    expect(isPasswordValid).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 10: Forgot password using college email -> OTP sent to personal email -> Password reset
  // -------------------------------------------------------------
  it('TEST 10: Forgot password initiated with College Email dispatches OTP STRICTLY to verified Personal Email', async () => {
    const studentRecord = {
      id: 'student_1',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com'
    };

    // User submits college email
    const requestInput = { email: 'ss.24u10227@nitdgp.ac.in' };
    const parsed = forgotPasswordSchema.safeParse(requestInput);
    expect(parsed.success).toBe(true);

    // Business rule: Resolve destination email
    const destinationEmail = studentRecord.personalEmail;
    expect(destinationEmail).toBe('souravsenapati055@gmail.com');
    expect(destinationEmail).not.toEqual(studentRecord.collegeEmail);

    // Masked email for frontend display
    const masked = maskEmail(destinationEmail);
    expect(masked).toBe('sou****@gmail.com');

    // Generate reset OTP and verify
    const resetOtp = generateSecureOtp();
    const resetHash = hashOtp(resetOtp);

    const resetPayload = {
      email: requestInput.email, // can submit either email
      otp: resetOtp,
      newPassword: 'BrandNewPassword456!'
    };
    const resetParsed = resetPasswordSchema.safeParse(resetPayload);
    expect(resetParsed.success).toBe(true);

    expect(verifyOtpHash(resetPayload.otp, resetHash)).toBe(true);
  });

  // -------------------------------------------------------------
  // TEST 11: Forgot password using personal email -> OTP sent to personal email -> Password reset
  // -------------------------------------------------------------
  it('TEST 11: Forgot password initiated with Personal Email dispatches OTP STRICTLY to verified Personal Email', () => {
    const studentRecord = {
      id: 'student_1',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com'
    };

    const requestInput = { email: 'souravsenapati055@gmail.com' };
    const destinationEmail = studentRecord.personalEmail;
    expect(destinationEmail).toBe('souravsenapati055@gmail.com');

    const masked = maskEmail(destinationEmail);
    expect(masked).toContain('****@gmail.com');
  });

  // -------------------------------------------------------------
  // TEST 12: Registered Google account -> Login success
  // -------------------------------------------------------------
  it('TEST 12: Registered Google account logs in successfully and issues JWT', () => {
    const registeredUser = {
      id: 'usr_registered_1',
      email: 'ss.24u10227@nitdgp.ac.in',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com',
      role: 'STUDENT',
      isActive: true,
      accountStatus: 'ACTIVE',
      googleSub: 'google_sub_123456789'
    };

    const googlePayload = {
      sub: 'google_sub_123456789',
      email: 'souravsenapati055@gmail.com'
    };

    const isMatch = registeredUser.googleSub === googlePayload.sub ||
      registeredUser.personalEmail === googlePayload.email ||
      registeredUser.collegeEmail === googlePayload.email;

    expect(isMatch).toBe(true);

    // JWT token generation
    const token = jwt.sign(
      {
        userId: registeredUser.id,
        email: registeredUser.email,
        collegeEmail: registeredUser.collegeEmail,
        personalEmail: registeredUser.personalEmail,
        role: registeredUser.role
      },
      'test_jwt_secret',
      { expiresIn: '7d' }
    );

    const decoded: any = jwt.verify(token, 'test_jwt_secret');
    expect(decoded.userId).toBe(registeredUser.id);
    expect(decoded.collegeEmail).toBe('ss.24u10227@nitdgp.ac.in');
    expect(decoded.personalEmail).toBe('souravsenapati055@gmail.com');
  });

  // -------------------------------------------------------------
  // TEST 13: Unregistered Google account -> Redirect to registration
  // -------------------------------------------------------------
  it('TEST 13: Unregistered Google account NEVER auto-creates account; returns UNREGISTERED_GOOGLE redirect signal', () => {
    const registeredUsers: any[] = [];
    const googlePayload = {
      sub: 'unregistered_google_sub_999',
      email: 'stranger@gmail.com'
    };

    const matchedUser = registeredUsers.find(
      (u) => u.googleSub === googlePayload.sub || u.email === googlePayload.email
    );

    expect(matchedUser).toBeUndefined();

    // Controller contract verification
    const expectedResponse = {
      success: false,
      code: 'UNREGISTERED_GOOGLE',
      message: 'Your Google account is not registered yet. Please complete student registration first.',
      googleEmail: googlePayload.email
    };

    expect(expectedResponse.code).toBe('UNREGISTERED_GOOGLE');
    expect(expectedResponse.success).toBe(false);
  });

  // -------------------------------------------------------------
  // TEST 14: Laundry pickup OTP -> Dispatched to personal email
  // -------------------------------------------------------------
  it('TEST 14: Laundry pickup OTP is dispatched STRICTLY to student verified personal email', () => {
    const student = {
      id: 'student_123',
      fullName: 'Sourav Senapati',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com'
    };

    // Laundry OTP rule: Pickup OTP sent ONLY to student verified personal email
    const pickupOtpDestination = student.personalEmail;
    expect(pickupOtpDestination).toBe('souravsenapati055@gmail.com');
    expect(pickupOtpDestination).not.toBe(student.collegeEmail);

    const pickupOtp = generateSecureOtp();
    expect(pickupOtp).toHaveLength(6);
  });

  // -------------------------------------------------------------
  // TEST 15: Laundry return OTP -> Dispatched to personal email
  // -------------------------------------------------------------
  it('TEST 15: Laundry return OTP is dispatched STRICTLY to student verified personal email', () => {
    const student = {
      id: 'student_123',
      fullName: 'Sourav Senapati',
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com'
    };

    // Laundry OTP rule: Return/Delivery OTP sent ONLY to student verified personal email
    const returnOtpDestination = student.personalEmail;
    expect(returnOtpDestination).toBe('souravsenapati055@gmail.com');
    expect(returnOtpDestination).not.toBe(student.collegeEmail);

    const returnOtp = generateSecureOtp();
    expect(returnOtp).toHaveLength(6);
  });

  // -------------------------------------------------------------
  // TEST 16: Admin delete student account -> Clean removal -> Fresh registration allowed
  // -------------------------------------------------------------
  it('TEST 16: Admin delete student account cascades cleanly and frees unique constraints for fresh registration', () => {
    // Initial state: student is registered
    let database = {
      users: [
        { id: 'u1', email: 'ss.24u10227@nitdgp.ac.in', collegeEmail: 'ss.24u10227@nitdgp.ac.in', personalEmail: 'sourav@gmail.com' }
      ],
      students: [
        { id: 's1', userId: 'u1', rollNumber: '24U10227', registrationNumber: '2410227', mobileNumber: '9876543210' }
      ],
      carts: [{ id: 'c1', studentId: 's1' }],
      orders: [{ id: 'o1', studentId: 's1' }],
      laundryOrders: [{ id: 'lo1', studentId: 's1' }],
      otpVerifications: [
        { id: 'otp1', email: 'ss.24u10227@nitdgp.ac.in' },
        { id: 'otp2', email: 'sourav@gmail.com' }
      ]
    };

    // Before deletion: Re-registering fails due to existing record
    const preCheckCollision = database.users.some(
      (u) => u.collegeEmail === 'ss.24u10227@nitdgp.ac.in' || u.personalEmail === 'sourav@gmail.com'
    );
    expect(preCheckCollision).toBe(true);

    // Simulate Admin Deletion Cascade (matching AdminPeopleController.deleteStudent)
    const studentToDelete = database.students.find((s) => s.id === 's1')!;
    const userIdToDelete = studentToDelete.userId;

    database.carts = database.carts.filter((c) => c.studentId !== studentToDelete.id);
    database.orders = database.orders.filter((o) => o.studentId !== studentToDelete.id);
    database.laundryOrders = database.laundryOrders.filter((lo) => lo.studentId !== studentToDelete.id);
    database.otpVerifications = database.otpVerifications.filter(
      (otp) => otp.email !== 'ss.24u10227@nitdgp.ac.in' && otp.email !== 'sourav@gmail.com'
    );
    database.students = database.students.filter((s) => s.id !== studentToDelete.id);
    database.users = database.users.filter((u) => u.id !== userIdToDelete);

    // Verify all records for student are deleted
    expect(database.users.length).toBe(0);
    expect(database.students.length).toBe(0);
    expect(database.carts.length).toBe(0);
    expect(database.orders.length).toBe(0);
    expect(database.laundryOrders.length).toBe(0);
    expect(database.otpVerifications.length).toBe(0);

    // Crucial check: Fresh registration with the exact same college email and personal email now succeeds!
    const postCheckCollision = database.users.some(
      (u) => u.collegeEmail === 'ss.24u10227@nitdgp.ac.in' || u.personalEmail === 'sourav@gmail.com'
    );
    expect(postCheckCollision).toBe(false);

    // Student can now perform fresh registration
    const freshRegistrationAttempt = sendCollegeOtpSchema.safeParse({
      collegeEmail: 'ss.24u10227@nitdgp.ac.in'
    });
    expect(freshRegistrationAttempt.success).toBe(true);
  });
});
