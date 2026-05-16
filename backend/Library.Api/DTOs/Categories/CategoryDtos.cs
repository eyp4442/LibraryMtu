namespace Library.Api.DTOs.Categories
{
    // Kategori listeleme ekranlarında kullanılan temel response DTO'su.
    public class CategoryListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    // Tekil kategori detayında kullanılan response DTO'su.
    // Şu an liste DTO'su ile aynı alanlara sahip olsa da ileride detay bilgileri genişletilebilir.
    public class CategoryDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    // Yeni kategori oluştururken frontend'den gelen request modelidir.
    public class CreateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
    }

    // Mevcut kategori adını güncellemek için kullanılan request modelidir.
    public class UpdateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
    }
}