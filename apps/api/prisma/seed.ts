import { PrismaClient, MembershipRole } from '@prisma/client'; import * as argon2 from 'argon2';
const prisma = new PrismaClient();
async function main(){ const passwordHash=await argon2.hash('ChangeMe123!'); const user=await prisma.user.upsert({where:{email:'owner@tbms.local'},update:{},create:{email:'owner@tbms.local',name:'TBMS Owner',passwordHash}}); const org=await prisma.organization.upsert({where:{slug:'demo-enterprise'},update:{},create:{name:'Demo Enterprise',slug:'demo-enterprise'}}); await prisma.membership.upsert({where:{userId_organizationId:{userId:user.id,organizationId:org.id}},update:{role:MembershipRole.OWNER},create:{userId:user.id,organizationId:org.id,role:MembershipRole.OWNER}}); }
main().finally(()=>prisma.$disconnect());
