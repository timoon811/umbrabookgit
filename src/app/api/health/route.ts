import { NextRequest, NextResponse } from "next/server";
import { getSystemHealth, quickHealthCheck } from "@/lib/system-health";

// GET /api/health - Проверка здоровья системы
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const quick = url.searchParams.get('quick') === 'true';
    
    if (quick) {
      // Быстрая проверка
      const result = await quickHealthCheck();
      return NextResponse.json(result, { 
        status: result.healthy ? 200 : 503 
      });
    }
    
    // Полная проверка
    const health = await getSystemHealth();
    
    return NextResponse.json(health, { 
      status: health.overall === 'error' ? 503 : 200 
    });
    
  } catch (error: any) {
    console.error("Health check failed:", error);
    
    return NextResponse.json(
      { 
        overall: 'error',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date()
      },
      { status: 500 }
    );
  }
}
