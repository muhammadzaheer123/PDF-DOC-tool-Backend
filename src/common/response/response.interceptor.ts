import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse } from "@/common/response/api-response.interface";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => {
        if (data && typeof data === "object" && "success" in data) {
          return data as unknown as ApiResponse<T>;
        }
        return { success: true, error: null, data };
      })
    );
  }
}
