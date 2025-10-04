import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: reportId } = await params

    // Check if report exists
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, reportCode: true, isAnonymous: true }
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    console.log('🗑️ Deleting report:', {
      reportId,
      reportCode: report.reportCode,
      isAnonymous: report.isAnonymous
    })

    // Delete the report (media will be cascade deleted due to schema)
    await prisma.report.delete({
      where: { id: reportId }
    })

    console.log('✅ Report deleted successfully:', report.reportCode)

    return NextResponse.json({ 
      success: true, 
      message: `Report ${report.reportCode} deleted successfully` 
    })

  } catch (error) {
    console.error('❌ Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
