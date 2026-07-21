-- 0009_rename_attempts_to_fail_count.sql — phone_verification.attempts 컬럼명 명확화
-- "attempts"는 총 시도 횟수로 오해되기 쉬워, 실제 의미(검증 실패 횟수)를 드러내는 fail_count로 변경.

alter table phone_verification
  rename column attempts to fail_count;
