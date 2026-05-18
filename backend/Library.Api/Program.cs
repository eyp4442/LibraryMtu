using System.Security.Claims;
using System.Text;
using Library.Api.Data;
using Library.Api.Interfaces;
using Library.Api.Models;
using Library.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using JwtClaimNames = Microsoft.IdentityModel.JsonWebTokens.JwtRegisteredClaimNames;

var builder = WebApplication.CreateBuilder(args);

// Controller tabanlı Web API yapısını aktif eder.
builder.Services.AddControllers();

// Veritabanı bağlantı bilgisi appsettings dosyasından okunur.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                      ?? throw new InvalidOperationException("DefaultConnection not found.");

// EF Core DbContext MySQL ile çalışacak şekilde kaydedilir.
builder.Services.AddDbContext<LibraryDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// ASP.NET Identity kullanıcı ve rol sistemi yapılandırılır.
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        // Demo/proje ortamı için şifre kuralları sade tutulmuştur.
        options.Password.RequireDigit = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;

        // Aynı email ile birden fazla Identity kullanıcısı oluşturulmasını engeller.
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<LibraryDbContext>()
    .AddDefaultTokenProviders();

// JWT doğrulaması için gerekli konfigürasyon değerleri okunur.
var jwtKey = builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("Jwt:Key not found.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException("Jwt:Issuer not found.");

var jwtAudience = builder.Configuration["Jwt:Audience"]
                  ?? throw new InvalidOperationException("Jwt:Audience not found.");

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

// API'nin varsayılan authentication yöntemi JWT Bearer olarak ayarlanır.
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        // Claim isimlerinin ASP.NET tarafından otomatik dönüştürülmesini engeller.
        // Böylece token içindeki claim isimleri daha kontrollü kullanılır.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = signingKey,

            // Token süresi dolduğunda ek tolerans tanınmaz.
            ClockSkew = TimeSpan.Zero,

            // Kullanıcı adı ve rol claim tipleri token üretimiyle uyumlu tutulur.
            NameClaimType = JwtClaimNames.UniqueName,
            RoleClaimType = ClaimTypes.Role
        };

        // Geliştirme sırasında JWT doğrulama hatalarını görmek için kullanılır.
        // Production ortamında daha kontrollü logging tercih edilmelidir.
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("JWT AUTH FAILED");
                Console.WriteLine(context.Exception.GetType().FullName);
                Console.WriteLine(context.Exception.Message);
                Console.WriteLine(context.Exception.ToString());
                return Task.CompletedTask;
            }
        };
    });

// Authorize attribute'larının çalışması için authorization servisi eklenir.
builder.Services.AddAuthorization();

// Token üretimi ve refresh token işlemleri için servis kaydı.
builder.Services.AddScoped<ITokenService, TokenService>();

// Swagger/OpenAPI dokümantasyonu aktif edilir.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Library.Api",
        Version = "v1"
    });

    // Swagger üzerinden JWT Bearer token ile test yapılmasını sağlar.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "JWT Authorization header. Example: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            Array.Empty<string>()
        }
    });
});

// Frontend geliştirme sunucularının API'ye istek atabilmesi için CORS politikası tanımlanır.
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Uygulama başlangıcında migrationlar uygulanır ve temel roller/kullanıcılar oluşturulur.
using (var scope = app.Services.CreateScope())
{
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

// Swagger yalnızca development ortamında açılır.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Frontend'den gelen isteklere CORS politikası uygulanır.
app.UseCors("FrontendDev");

// wwwroot altındaki upload edilmiş kitap görsellerinin frontend tarafından görüntülenmesini sağlar.
app.UseStaticFiles();

// Önce kullanıcının kimliği doğrulanır.
app.UseAuthentication();

// Logout edilen access tokenların tekrar kullanılmasını engeller.
// AuthController logout sırasında access token'ın jti değerini RevokedAccessTokens tablosuna kaydediyorsa,
// burada her authenticated istekte o jti kontrol edilir.
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true)
    {
        // TokenService içinde eklenen JWT ID claim'i token içinde "jti" adıyla bulunur.
        var jti = context.User.FindFirst("jti")?.Value;

        if (!string.IsNullOrWhiteSpace(jti))
        {
            var dbContext = context.RequestServices.GetRequiredService<LibraryDbContext>();

            var isRevoked = await dbContext.RevokedAccessTokens
                .AnyAsync(x => x.Jti == jti && x.ExpiresAt > DateTime.UtcNow);

            if (isRevoked)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                await context.Response.WriteAsJsonAsync(new
                {
                    error = new
                    {
                        code = "ACCESS_TOKEN_REVOKED",
                        message = "Access token has been revoked"
                    }
                });

                return;
            }
        }
    }

    await next();
});

// Kimlik doğrulandıktan ve revoked token kontrolünden geçtikten sonra rol/yetki kontrolü yapılır.
app.UseAuthorization();

// Controller endpointleri request pipeline'a eklenir.
app.MapControllers();

app.Run();