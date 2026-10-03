const { clean } = require("../ingredients");
function safetyResponse(prompt, member, policyStatus) {
  const normalized = clean(prompt);
  const vi = /[\u00c0-\u1ef9]/.test(prompt);
  const healthRequest = /\b(calorie|calories|kcal|bmi|bmr|tdee|diet|weight|fasting|deficit|obesity|diagnose|diabetes|kidney|pregnan|breastfeed|purge|vomit)\b|calo|giam can|tang can|nhin an|beo phi|benh|tieu duong|than|mang thai|cho con bu|bu tru|dot mo/.test(normalized);
  const child = member.child || (member.metrics?.age !== undefined && member.metrics.age < 18);
  if (healthRequest && child) return vi ? "Với trẻ em, mình hỗ trợ bữa ăn đa dạng và thói quen phù hợp gia đình. Mình không đặt mức thâm hụt calo hay lộ trình giảm cân cho trẻ. Diễn giải chỉ số tăng trưởng cần chuyên gia duyệt; hãy trao đổi với chuyên gia khi cần đánh giá sức khỏe của trẻ." : "For children, I support varied family meals and healthy habits. I do not prescribe calorie deficits or weight-loss plans. Growth interpretation needs specialist review; discuss health assessment with a qualified professional.";
  if (healthRequest && policyStatus !== "approved") return vi ? "Các chỉ số đã tính được hiển thị trong Profile. Mục tiêu calo, điều chỉnh tăng/giảm cân và diễn giải chuyên môn đang chờ chính sách được chuyên gia duyệt. Mình có thể giúp bạn chọn món, ghi nhận bữa ăn và chuẩn bị kế hoạch phù hợp lịch sinh hoạt." : "Calculated indicators are displayed in Profile. Calorie targets, weight-change adjustments and clinical interpretation await a specialist-approved policy. I can help choose meals, record food and plan around your schedule.";
  if (/nhin an|purge|vomit|starv|bu tru|punish|extreme|cure|diagnos|chua benh/.test(normalized)) return vi ? "Mình không đề xuất nhịn ăn, bù trừ bữa ăn hoặc điều trị bệnh. Hãy dùng kế hoạch bữa ăn đều đặn và trao đổi với chuyên gia nếu bạn cần hỗ trợ sức khỏe." : "I do not recommend starvation, compensatory eating or medical treatment. Use regular meals and seek qualified support for health concerns.";
  return null;
}
module.exports = { safetyResponse };
