import { PrismaClient } from '@prisma/client';
import { TemplateService } from '../services/templateService';

async function initializeSystemTemplates() {
  const prisma = new PrismaClient();
  const templateService = new TemplateService(prisma);

  try {
    console.log('🚀 Initializing system checklist templates...');
    
    await templateService.initializeSystemTemplates();
    
    console.log('✅ System templates initialized successfully!');
    
    // Verify templates were created
    const systemTemplates = await prisma.checklistTemplate.count({
      where: { isSystem: true }
    });
    
    console.log(`📊 Total system templates created: ${systemTemplates}`);
    
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeSystemTemplates();
}

export { initializeSystemTemplates };