"use server";

import { cancellationManager } from "@/infrastructure/RequestCancellationManager";

export async function cancelRequestAction(requestId: string): Promise<{ success: boolean; message: string }> {
  const cancelled = cancellationManager.cancelRequest(requestId);
  
  if (cancelled) {
    return { 
      success: true, 
      message: `Request ${requestId} has been cancelled.` 
    };
  } else {
    return { 
      success: false, 
      message: `No active request found with ID ${requestId}.` 
    };
  }
}

export async function getActiveRequestsAction(): Promise<{ requestIds: string[] }> {
  return { requestIds: cancellationManager.getActiveRequestIds() };
}
