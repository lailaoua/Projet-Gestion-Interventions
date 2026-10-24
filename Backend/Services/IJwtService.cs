using Pfa1.Api.Models;

namespace Pfa1.Api.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}
