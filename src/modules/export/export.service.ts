import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/config/prisma/prisma.service';
import * as csvWriter from 'csv-writer';
import * as ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import { 
  ExportSubmissionsDto, 
  ExportCouponsDto, 
  ExportResult, 
  ExportFormat 
} from './dto';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export user submissions to CSV, Excel, or PDF
   */
  async exportSubmissions(options: ExportSubmissionsDto): Promise<ExportResult> {
    this.logger.log(`Exporting submissions in ${options.format} format`);

    // Get submissions data with filters
    const submissions = await this.getSubmissionsData(options);

    switch (options.format) {
      case ExportFormat.CSV:
        return await this.exportSubmissionsToCsv(submissions, options);
      case ExportFormat.EXCEL:
        return await this.exportSubmissionsToExcel(submissions, options);
      case ExportFormat.PDF:
        return await this.exportSubmissionsToPdf(submissions, options);
      default:
        throw new BadRequestException('Unsupported export format');
    }
  }

  /**
   * Export coupon codes to CSV or PDF
   */
  async exportCoupons(options: ExportCouponsDto): Promise<ExportResult> {
    this.logger.log(`Exporting coupons in ${options.format} format`);

    // Get coupons data with filters
    const coupons = await this.getCouponsData(options);

    switch (options.format) {
      case ExportFormat.CSV:
        return await this.exportCouponsToCsv(coupons, options);
      case ExportFormat.PDF:
        return await this.exportCouponsToPdf(coupons, options);
      default:
        throw new BadRequestException('Unsupported export format for coupons');
    }
  }

  /**
   * Get submissions data with applied filters
   */
  private async getSubmissionsData(options: ExportSubmissionsDto) {
    const where: any = {};

    // Apply filters
    if (options.filters) {
      if (options.filters.dateFrom || options.filters.dateTo) {
        where.submittedAt = {};
        if (options.filters.dateFrom) {
          where.submittedAt.gte = new Date(options.filters.dateFrom);
        }
        if (options.filters.dateTo) {
          where.submittedAt.lte = new Date(options.filters.dateTo);
        }
      }

      if (options.filters.hasReward !== undefined) {
        if (options.filters.hasReward) {
          where.assignedRewardId = { not: null };
        } else {
          where.assignedRewardId = null;
        }
      }

      if (options.filters.couponBatchId) {
        where.coupon = {
          batchId: options.filters.couponBatchId
        };
      }
    }

    return await this.prisma.submission.findMany({
      where,
      include: {
        coupon: {
          select: {
            couponCode: true,
            batchId: true,
            status: true,
            createdAt: true,
            expiresAt: true
          }
        },
        assignedReward: {
          select: {
            serviceName: true,
            accountType: true,
            category: true,
            status: true
          }
        },
        rewardAssignedByAdmin: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
  }

  /**
   * Get coupons data with applied filters
   */
  private async getCouponsData(options: ExportCouponsDto) {
    const where: any = {};

    // Apply filters
    if (options.filters) {
      if (options.filters.status) {
        where.status = options.filters.status;
      }

      if (options.filters.batchId) {
        where.batchId = options.filters.batchId;
      }

      if (options.filters.createdBy) {
        where.createdBy = options.filters.createdBy;
      }

      if (options.filters.dateFrom || options.filters.dateTo) {
        where.createdAt = {};
        if (options.filters.dateFrom) {
          where.createdAt.gte = new Date(options.filters.dateFrom);
        }
        if (options.filters.dateTo) {
          where.createdAt.lte = new Date(options.filters.dateTo);
        }
      }
    }

    return await this.prisma.coupon.findMany({
      where,
      include: {
        creator: {
          select: {
            username: true,
            email: true
          }
        },
        submission: {
          select: {
            name: true,
            email: true,
            submittedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Export submissions to CSV format
   */
  private async exportSubmissionsToCsv(submissions: any[], options: ExportSubmissionsDto): Promise<ExportResult> {
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'name', title: 'Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'address', title: 'Address' },
      { id: 'productExperience', title: 'Product Experience' },
      { id: 'couponCode', title: 'Coupon Code' },
      { id: 'submittedAt', title: 'Submitted At' },
      { id: 'rewardService', title: 'Assigned Reward Service' },
      { id: 'rewardType', title: 'Reward Type' },
      { id: 'rewardAssignedAt', title: 'Reward Assigned At' },
      { id: 'assignedBy', title: 'Assigned By Admin' }
    ];

    if (options.includeMetadata) {
      headers.push(
        { id: 'ipAddress', title: 'IP Address' },
        { id: 'userAgent', title: 'User Agent' },
        { id: 'batchId', title: 'Coupon Batch ID' },
        { id: 'couponStatus', title: 'Coupon Status' }
      );
    }

    // Transform data for CSV
    const csvData = submissions.map(submission => {
      const baseData = {
        id: submission.id,
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        address: submission.address,
        productExperience: submission.productExperience,
        couponCode: submission.coupon?.couponCode || '',
        submittedAt: submission.submittedAt?.toISOString() || '',
        rewardService: submission.assignedReward?.serviceName || '',
        rewardType: submission.assignedReward?.accountType || '',
        rewardAssignedAt: submission.rewardAssignedAt?.toISOString() || '',
        assignedBy: submission.rewardAssignedByAdmin?.username || ''
      };

      if (options.includeMetadata) {
        return {
          ...baseData,
          ipAddress: submission.ipAddress || '',
          userAgent: submission.userAgent || '',
          batchId: submission.coupon?.batchId || '',
          couponStatus: submission.coupon?.status || ''
        };
      }

      return baseData;
    });

    // Create CSV content
    const createCsvWriter = csvWriter.createObjectCsvStringifier({
      header: headers
    });

    const csvContent = createCsvWriter.getHeaderString() + createCsvWriter.stringifyRecords(csvData);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `submissions_export_${timestamp}.csv`;

    return {
      data: Buffer.from(csvContent, 'utf8').toString('base64'),
      filename,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export submissions to Excel format
   */
  private async exportSubmissionsToExcel(submissions: any[], options: ExportSubmissionsDto): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Submissions');

    // Define columns
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Product Experience', key: 'productExperience', width: 50 },
      { header: 'Coupon Code', key: 'couponCode', width: 15 },
      { header: 'Submitted At', key: 'submittedAt', width: 20 },
      { header: 'Assigned Reward Service', key: 'rewardService', width: 25 },
      { header: 'Reward Type', key: 'rewardType', width: 20 },
      { header: 'Reward Assigned At', key: 'rewardAssignedAt', width: 20 },
      { header: 'Assigned By Admin', key: 'assignedBy', width: 20 }
    ];

    if (options.includeMetadata) {
      columns.push(
        { header: 'IP Address', key: 'ipAddress', width: 15 },
        { header: 'User Agent', key: 'userAgent', width: 30 },
        { header: 'Coupon Batch ID', key: 'batchId', width: 15 },
        { header: 'Coupon Status', key: 'couponStatus', width: 15 }
      );
    }

    worksheet.columns = columns;

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    submissions.forEach(submission => {
      const rowData = {
        id: submission.id,
        name: submission.name,
        email: submission.email,
        phone: submission.phone,
        address: submission.address,
        productExperience: submission.productExperience,
        couponCode: submission.coupon?.couponCode || '',
        submittedAt: submission.submittedAt?.toISOString() || '',
        rewardService: submission.assignedReward?.serviceName || '',
        rewardType: submission.assignedReward?.accountType || '',
        rewardAssignedAt: submission.rewardAssignedAt?.toISOString() || '',
        assignedBy: submission.rewardAssignedByAdmin?.username || ''
      };

      if (options.includeMetadata) {
        Object.assign(rowData, {
          ipAddress: submission.ipAddress || '',
          userAgent: submission.userAgent || '',
          batchId: submission.coupon?.batchId || '',
          couponStatus: submission.coupon?.status || ''
        });
      }

      worksheet.addRow(rowData);
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `submissions_export_${timestamp}.xlsx`;

    return {
      data: Buffer.from(buffer).toString('base64'),
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  /**
   * Export submissions to PDF format
   */
  private async exportSubmissionsToPdf(submissions: any[], options: ExportSubmissionsDto): Promise<ExportResult> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(16);
    doc.text('User Submissions Export', 20, yPosition);
    yPosition += 20;

    // Export info
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total Records: ${submissions.length}`, 20, yPosition);
    yPosition += 20;

    // Table headers
    doc.setFontSize(8);
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Coupon', 'Submitted', 'Reward'];
    let xPosition = 20;
    const columnWidths = [15, 30, 40, 25, 20, 25, 25];

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });
    yPosition += 10;

    // Table data
    submissions.forEach(submission => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const rowData = [
        submission.id.toString(),
        submission.name.substring(0, 15),
        submission.email.substring(0, 20),
        submission.phone.substring(0, 12),
        submission.coupon?.couponCode || '',
        submission.submittedAt?.toLocaleDateString() || '',
        submission.assignedReward?.serviceName?.substring(0, 12) || ''
      ];

      rowData.forEach((data, index) => {
        doc.text(data, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 8;
    });

    const pdfBuffer = doc.output('arraybuffer');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `submissions_export_${timestamp}.pdf`;

    return {
      data: Buffer.from(pdfBuffer).toString('base64'),
      filename,
      mimeType: 'application/pdf'
    };
  }

  /**
   * Export coupons to CSV format
   */
  private async exportCouponsToCsv(coupons: any[], options: ExportCouponsDto): Promise<ExportResult> {
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'couponCode', title: 'Coupon Code' },
      { id: 'status', title: 'Status' },
      { id: 'batchId', title: 'Batch ID' },
      { id: 'createdAt', title: 'Created At' },
      { id: 'expiresAt', title: 'Expires At' },
      { id: 'redeemedAt', title: 'Redeemed At' },
      { id: 'redeemedBy', title: 'Redeemed By' },
      { id: 'createdBy', title: 'Created By Admin' }
    ];

    if (options.includeMetadata) {
      headers.push(
        { id: 'codeLength', title: 'Code Length' },
        { id: 'generationMethod', title: 'Generation Method' }
      );
    }

    // Transform data for CSV
    const csvData = coupons.map(coupon => {
      const baseData = {
        id: coupon.id,
        couponCode: coupon.couponCode,
        status: coupon.status,
        batchId: coupon.batchId || '',
        createdAt: coupon.createdAt?.toISOString() || '',
        expiresAt: coupon.expiresAt?.toISOString() || '',
        redeemedAt: coupon.redeemedAt?.toISOString() || '',
        redeemedBy: coupon.submission?.email || '',
        createdBy: coupon.creator?.username || ''
      };

      if (options.includeMetadata) {
        return {
          ...baseData,
          codeLength: coupon.codeLength,
          generationMethod: coupon.generationMethod || ''
        };
      }

      return baseData;
    });

    // Create CSV content
    const createCsvWriter = csvWriter.createObjectCsvStringifier({
      header: headers
    });

    const csvContent = createCsvWriter.getHeaderString() + createCsvWriter.stringifyRecords(csvData);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coupons_export_${timestamp}.csv`;

    return {
      data: Buffer.from(csvContent, 'utf8').toString('base64'),
      filename,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export coupons to PDF format
   */
  private async exportCouponsToPdf(coupons: any[], options: ExportCouponsDto): Promise<ExportResult> {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(16);
    doc.text('Coupon Codes Export', 20, yPosition);
    yPosition += 20;

    // Export info
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total Coupons: ${coupons.length}`, 20, yPosition);
    yPosition += 20;

    // Table headers
    doc.setFontSize(8);
    const headers = ['ID', 'Code', 'Status', 'Batch', 'Created', 'Expires', 'Redeemed By'];
    let xPosition = 20;
    const columnWidths = [15, 25, 20, 20, 25, 25, 30];

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += columnWidths[index];
    });
    yPosition += 10;

    // Table data
    coupons.forEach(coupon => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const rowData = [
        coupon.id.toString(),
        coupon.couponCode,
        coupon.status,
        coupon.batchId || '',
        coupon.createdAt?.toLocaleDateString() || '',
        coupon.expiresAt?.toLocaleDateString() || '',
        coupon.submission?.email?.substring(0, 20) || ''
      ];

      rowData.forEach((data, index) => {
        doc.text(data, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 8;
    });

    const pdfBuffer = doc.output('arraybuffer');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `coupons_export_${timestamp}.pdf`;

    return {
      data: Buffer.from(pdfBuffer).toString('base64'),
      filename,
      mimeType: 'application/pdf'
    };
  }
}