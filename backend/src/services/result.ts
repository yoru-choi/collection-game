export interface ServiceSuccess<T> {
  ok: true;
  data: T;
  status?: number;
}

export interface ServiceFailure {
  ok: false;
  error: string;
  status: number;
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export const serviceOk = <T>(data: T, status?: number): ServiceSuccess<T> => ({
  ok: true,
  data,
  status,
});

export const serviceFail = (error: string, status: number): ServiceFailure => ({
  ok: false,
  error,
  status,
});
